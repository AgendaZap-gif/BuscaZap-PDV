import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, companyProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as agendaDb from "./agendaDb";
import { createRequire } from "module";
import { buildCompanyPrompt, companyToBrainData, parseDataBlock, type DataBlock } from "./_core/buscazapBrain";
import { geminiChat, toGeminiMessages, isGeminiConfigured, geminiExtractTextFromImage } from "./_core/gemini";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string }>;

export const appRouter = router({
  system: systemRouter,

  // ==================== CÉREBRO BUSCAZAP (IA por empresa) ====================
  companyAi: router({
    /** Verifica se a IA (Gemini) está configurada globalmente. Uso interno / painel. */
    isConfigured: publicProcedure.query(() => ({
      configured: isGeminiConfigured(),
    })),

    /**
     * Verifica se o chat com IA está habilitado para esta empresa.
     * Habilitado quando: company_ai_settings.aiEnabled = true (configurado no painel da empresa ou por plano destaque+).
     * Permite vender "serviço IA" separado sem plano destaque.
     */
    chatEnabledForCompany: publicProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        const company = await db.getCompanyById(input.companyId);
        if (!company) return { enabled: false };
        const settings = await db.getCompanyAiSettings(input.companyId);
        const enabled = settings?.aiEnabled === true;
        return { enabled };
      }),

    /**
     * Retorna as configurações de IA da empresa (painel: Configurar assistente / Treinamento).
     */
    getSettings: publicProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        const company = await db.getCompanyById(input.companyId);
        if (!company) return null;
        return db.getCompanyAiSettings(input.companyId);
      }),

    /**
     * Cria/atualiza company_ai_settings. Chamado pelo painel ao ativar e salvar o assistente.
     * Define aiEnabled e demais campos de configuração/treinamento.
     */
    upsertSettings: publicProcedure
      .input(
        z.object({
          companyId: z.number(),
          aiEnabled: z.boolean(),
          autoResponseEnabled: z.boolean().optional(),
          escalateToHumanEnabled: z.boolean().optional(),
          personality: z.enum(["professional", "friendly", "casual", "formal"]).optional(),
          language: z.string().optional(),
          customGreeting: z.string().nullable().optional(),
          customInstructions: z.string().nullable().optional(),
          businessHours: z
            .object({
              enabled: z.boolean(),
              schedule: z.record(z.string(), z.object({ open: z.string(), close: z.string() }).nullable()).optional(),
              outsideHoursMessage: z.string().optional(),
            })
            .nullable()
            .optional(),
          maxMessagesPerDay: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const company = await db.getCompanyById(input.companyId);
        if (!company) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada." });
        }
        await db.upsertCompanyAiSettings(input.companyId, {
          aiEnabled: input.aiEnabled,
          autoResponseEnabled: input.autoResponseEnabled,
          escalateToHumanEnabled: input.escalateToHumanEnabled,
          personality: input.personality,
          language: input.language,
          customGreeting: input.customGreeting,
          customInstructions: input.customInstructions,
          businessHours: input.businessHours ?? undefined,
          maxMessagesPerDay: input.maxMessagesPerDay,
        });
        return { success: true };
      }),

    /**
     * Envia mensagens e recebe resposta da IA da empresa.
     * Salva conversa, atualiza CRM e comportamento.
     * Exige: Gemini configurado, empresa existe, chat habilitado para a empresa (company_ai_settings.aiEnabled).
     */
    reply: publicProcedure
      .input(
        z.object({
          companyId: z.number(),
          messages: z.array(z.object({ role: z.enum(["user", "assistant", "system"]), content: z.string() })),
          customerPhone: z.string().optional(),
          channel: z.enum(["whatsapp", "app", "web", "telegram"]).optional(),
          knowledgeBaseOverride: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        if (!isGeminiConfigured()) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "IA não configurada. Defina GEMINI_API_KEY no servidor." });
        }

        const company = await db.getCompanyById(input.companyId);
        if (!company) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada." });
        }

        const settings = await db.getCompanyAiSettings(input.companyId);
        if (settings?.aiEnabled !== true) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Chat com IA não está habilitado para esta empresa. Configure no painel da empresa ou contrate o plano.",
          });
        }

        const customerPhone = input.customerPhone ?? "anonymous";
        const channel = input.channel ?? "app";

        const conv = await db.getOrCreateConversation(
          input.companyId,
          customerPhone,
          channel,
          undefined
        );

        const history = await db.getConversationMessages(conv.id, 30);
        const historyForLlm = history.reverse().map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        }));

        const lastUser = input.messages.filter((m) => m.role === "user").pop();
        const userContent = lastUser?.content ?? input.messages[input.messages.length - 1]?.content ?? "";

        if (userContent.trim()) {
          await db.addMessageToConversation(conv.id, input.companyId, "customer", userContent.trim(), channel);
        }

        const knowledgeBase =
          input.knowledgeBaseOverride ??
          (await db.getCompanyKnowledgeForBrain(input.companyId));
        const userBehaviorData = await db.getUserBehaviorSummaryForBrain(input.companyId, customerPhone);

        const companyData = companyToBrainData(company, undefined);
        const systemPrompt = buildCompanyPrompt(companyData, {
          company_knowledge_base: knowledgeBase,
          user_behavior_data: userBehaviorData,
        });

        const allMessages = [
          ...historyForLlm,
          ...input.messages
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        ];
        if (allMessages.length === 0 && userContent.trim()) {
          allMessages.push({ role: "user" as const, content: userContent.trim() });
        }

        const geminiMessages = toGeminiMessages(allMessages);
        const result = await geminiChat({
          systemInstruction: systemPrompt,
          messages: geminiMessages,
          maxOutputTokens: 2048,
          temperature: 0.7,
        });

        const { text, dataBlock } = parseDataBlock(result.text);

        const aiMetadata: DataBlock | undefined = dataBlock
          ? {
              intent: dataBlock.intent,
              lead_score: dataBlock.lead_score,
              tags: dataBlock.tags,
              products: dataBlock.products,
              next_action: dataBlock.next_action,
              crm_update: dataBlock.crm_update,
            }
          : undefined;

        await db.addMessageToConversation(
          conv.id,
          input.companyId,
          "assistant",
          text,
          channel,
          aiMetadata
            ? {
                intent: aiMetadata.intent,
                leadScore: aiMetadata.lead_score,
                tags: aiMetadata.tags,
                products: aiMetadata.products,
                nextAction: aiMetadata.next_action,
                crmUpdate: aiMetadata.crm_update,
              }
            : undefined
        );

        if (dataBlock && customerPhone !== "anonymous") {
          await db.upsertCrmFromDataBlock(input.companyId, customerPhone, {
            lead_score: dataBlock.lead_score,
            tags: dataBlock.tags,
            crm_update: dataBlock.crm_update,
          });
          const companyCategory = (company.settings as Record<string, string> | undefined)?.category ?? undefined;
          await db.trackUserBehavior(input.companyId, customerPhone, "message", companyCategory);
        }

        return {
          text,
          dataBlock: dataBlock ?? undefined,
          model: result.model,
        };
      }),

    /**
     * Extrai texto de arquivos (PDF e imagens) para treinar a base de conhecimento da IA.
     * Usado no painel "Configurar assistente IA" ao importar cardápio, catálogo etc.
     * - Imagens: usa Gemini Vision (OCR)
     * - PDF: usa pdf-parse
     */
    extractKnowledgeFromFiles: publicProcedure
      .input(
        z.object({
          companyId: z.number(),
          files: z.array(
            z.object({
              base64: z.string(),
              mimeType: z.string(),
              fileName: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        if (!isGeminiConfigured()) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "IA não configurada. Defina GEMINI_API_KEY no servidor.",
          });
        }

        const company = await db.getCompanyById(input.companyId);
        if (!company) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada." });
        }

        const IMAGE_MIMES = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
        ];
        const extractedChunks: string[] = [];

        for (const file of input.files) {
          const mime = file.mimeType?.toLowerCase() || "";
          const base64Clean = file.base64.replace(/^data:[^;]+;base64,/, "");

          try {
            if (mime === "application/pdf") {
              const buffer = Buffer.from(base64Clean, "base64");
              const pdfData = await pdfParse(buffer);
              if (pdfData?.text?.trim()) {
                extractedChunks.push(`\n--- Conteúdo do PDF "${file.fileName || "documento"}": ---\n${pdfData.text.trim()}`);
              }
            } else if (IMAGE_MIMES.includes(mime)) {
              const text = await geminiExtractTextFromImage(base64Clean, mime);
              if (text?.trim()) {
                extractedChunks.push(`\n--- Conteúdo da imagem "${file.fileName || "imagem"}": ---\n${text.trim()}`);
              }
            } else {
              throw new Error(`Tipo de arquivo não suportado: ${mime}. Use PDF ou imagens (JPEG, PNG, GIF, WebP).`);
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Erro ao processar arquivo";
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Erro ao processar "${file.fileName || "arquivo"}": ${msg}`,
            });
          }
        }

        const extractedText = extractedChunks.join("\n").trim();
        if (!extractedText) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Nenhum texto foi extraído dos arquivos. Verifique se os arquivos contêm texto legível.",
          });
        }

        return { extractedText };
      }),
  }),

  // ==================== AUTH EMPRESA (painel BuscaZap IA - JWT) ====================
  companyAuth: router({
    register: publicProcedure
      .input(z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(6), referralCode: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { registerCompany } = await import("./_core/companyAuth.js");
        return await registerCompany(input.name, input.email, input.password, input.referralCode);
      }),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const { loginCompany } = await import("./_core/companyAuth.js");
        return await loginCompany(input.email, input.password);
      }),
  }),

  // ==================== PAINEL ADMIN BUSCAZAP IA ====================
  admin: router({
    getMetrics: companyProcedure
      .input(z.object({ companyId: z.number(), period: z.enum(["today", "week", "month"]) }))
      .query(async ({ input, ctx }) => {
        if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado." });
        return await db.getCompanyMetricsForDashboard(input.companyId, input.period);
      }),
    getCrm: companyProcedure
      .input(z.object({ companyId: z.number(), limit: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado." });
        return await db.getCrmContactsByCompany(input.companyId, input.limit ?? 100);
      }),
    trainPdf: companyProcedure
      .input(z.object({ companyId: z.number(), title: z.string(), content: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado." });
        const id = await db.addCompanyKnowledge(input.companyId, "pdf", input.title, input.content);
        const { storeEmbedding, isEmbeddingsConfigured } = await import("./_core/embeddings.js");
        if (isEmbeddingsConfigured()) {
          try {
            await storeEmbedding(input.companyId, input.content.slice(0, 8000));
          } catch (e) {
            console.warn("[Admin] Embedding store failed:", e);
          }
        }
        return { id };
      }),
    promotionsSend: companyProcedure
      .input(z.object({ companyId: z.number(), message: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado." });
        const phones = await db.getActiveCustomerPhones(input.companyId);
        for (const phone of phones) {
          await db.enqueueNotification({
            companyId: input.companyId,
            customerPhone: phone,
            type: "promotion",
            message: input.message,
            scheduledFor: new Date(),
          });
        }
        return { sent: phones.length };
      }),
  }),

  // ==================== AGENDA (Secretária - clínicas, hospitais, comércios) ====================
  agenda: router({
    healthPlans: router({
      list: companyProcedure
        .input(z.object({ companyId: z.number() }))
        .query(async ({ input, ctx }) => {
          if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN" });
          return agendaDb.getAgendaHealthPlans(input.companyId);
        }),
      create: companyProcedure
        .input(z.object({ companyId: z.number(), name: z.string(), slug: z.string(), color: z.string().optional(), defaultDurationMinutes: z.number().optional() }))
        .mutation(async ({ input, ctx }) => {
          if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN" });
          return agendaDb.createAgendaHealthPlan(input.companyId, input);
        }),
      update: companyProcedure
        .input(z.object({ companyId: z.number(), id: z.number(), name: z.string().optional(), slug: z.string().optional(), color: z.string().optional(), isActive: z.boolean().optional(), defaultDurationMinutes: z.number().optional() }))
        .mutation(async ({ input, ctx }) => {
          if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN" });
          const { id, companyId, ...data } = input;
          await agendaDb.updateAgendaHealthPlan(id, companyId, data);
        }),
      delete: companyProcedure
        .input(z.object({ companyId: z.number(), id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN" });
          await agendaDb.deleteAgendaHealthPlan(input.id, input.companyId);
        }),
    }),
    patients: router({
      list: companyProcedure
        .input(z.object({ companyId: z.number(), search: z.string().optional() }))
        .query(async ({ input, ctx }) => {
          if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN" });
          return agendaDb.getAgendaPatients(input.companyId, input.search);
        }),
      get: companyProcedure
        .input(z.object({ companyId: z.number(), id: z.number() }))
        .query(async ({ input, ctx }) => {
          if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN" });
          return agendaDb.getAgendaPatientById(input.id, input.companyId);
        }),
      getByPhone: companyProcedure
        .input(z.object({ companyId: z.number(), phone: z.string() }))
        .query(async ({ input, ctx }) => {
          if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN" });
          return agendaDb.getAgendaPatientByPhone(input.companyId, input.phone);
        }),
      create: companyProcedure
        .input(z.object({
          companyId: z.number(),
          name: z.string(),
          phone: z.string(),
          email: z.string().optional(),
          document: z.string().optional(),
          birthDate: z.string().optional(),
          healthPlanId: z.number().nullable().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN" });
          const { companyId, ...data } = input;
          return agendaDb.createAgendaPatient(companyId, data);
        }),
      update: companyProcedure
        .input(z.object({
          companyId: z.number(),
          id: z.number(),
          name: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          document: z.string().optional(),
          birthDate: z.string().optional(),
          healthPlanId: z.number().nullable().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN" });
          const { id, companyId, ...data } = input;
          await agendaDb.updateAgendaPatient(id, companyId, data);
        }),
      delete: companyProcedure
        .input(z.object({ companyId: z.number(), id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN" });
          await agendaDb.deleteAgendaPatient(input.id, input.companyId);
        }),
    }),
    availability: router({
      list: companyProcedure
        .input(z.object({ companyId: z.number() }))
        .query(async ({ input, ctx }) => {
          if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN" });
          return agendaDb.getAgendaAvailability(input.companyId);
        }),
      set: companyProcedure
        .input(z.object({
          companyId: z.number(),
          slots: z.array(z.object({ dayOfWeek: z.number(), startTime: z.string(), endTime: z.string(), slotMinutes: z.number().optional() })),
        }))
        .mutation(async ({ input, ctx }) => {
          if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN" });
          await agendaDb.setAgendaAvailability(input.companyId, input.slots);
        }),
    }),
    quotas: router({
      list: companyProcedure
        .input(z.object({ companyId: z.number() }))
        .query(async ({ input, ctx }) => {
          if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN" });
          return agendaDb.getAgendaQuotas(input.companyId);
        }),
      set: companyProcedure
        .input(z.object({ companyId: z.number(), healthPlanId: z.number(), period: z.enum(["week", "month"]), maxSlots: z.number() }))
        .mutation(async ({ input, ctx }) => {
          if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN" });
          await agendaDb.setAgendaQuota(input.companyId, input.healthPlanId, input.period, input.maxSlots);
        }),
    }),
    appointments: router({
      list: companyProcedure
        .input(z.object({ companyId: z.number(), start: z.date(), end: z.date() }))
        .query(async ({ input, ctx }) => {
          if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN" });
          return agendaDb.getAgendaAppointmentsInRange(input.companyId, input.start, input.end);
        }),
      get: companyProcedure
        .input(z.object({ companyId: z.number(), id: z.number() }))
        .query(async ({ input, ctx }) => {
          if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN" });
          return agendaDb.getAgendaAppointmentById(input.id, input.companyId);
        }),
      create: companyProcedure
        .input(z.object({
          companyId: z.number(),
          patientId: z.number(),
          healthPlanId: z.number().nullable().optional(),
          startAt: z.date(),
          endAt: z.date(),
          durationMinutes: z.number().optional(),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN" });
          const check = await agendaDb.checkAgendaQuotaBeforeBook(input.companyId, input.healthPlanId ?? null, input.startAt);
          if (!check.allowed) throw new TRPCError({ code: "BAD_REQUEST", message: check.reason });
          return agendaDb.createAgendaAppointment(input.companyId, input);
        }),
      updateStatus: companyProcedure
        .input(z.object({ companyId: z.number(), id: z.number(), status: z.enum(["scheduled", "confirmed", "cancelled", "completed", "no_show"]) }))
        .mutation(async ({ input, ctx }) => {
          if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN" });
          await agendaDb.updateAgendaAppointmentStatus(input.id, input.companyId, input.status, input.status === "confirmed" ? new Date() : undefined);
        }),
      sendConfirmation: companyProcedure
        .input(z.object({ companyId: z.number(), id: z.number(), baseUrl: z.string() }))
        .mutation(async ({ input, ctx }) => {
          if (ctx.companyId !== input.companyId) throw new TRPCError({ code: "FORBIDDEN" });
          const app = await agendaDb.getAgendaAppointmentById(input.id, input.companyId);
          if (!app?.patient) throw new TRPCError({ code: "NOT_FOUND", message: "Agendamento ou paciente não encontrado." });
          const { sendAppointmentConfirmation } = await import("./_core/salebotAgenda.js");
          const msg = `Confirmação: você tem consulta agendada para ${new Date(app.startAt).toLocaleString("pt-BR")}.`;
          const result = await sendAppointmentConfirmation(input.id, input.companyId, app.patient.phone, msg, input.baseUrl);
          if (!result.success) throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
          return { sent: true };
        }),
    }),
    getAvailableSlots: publicProcedure
      .input(z.object({ companyId: z.number(), date: z.date(), healthPlanId: z.number().nullable().optional(), durationMinutes: z.number().optional() }))
      .query(async ({ input }) => {
        return agendaDb.getAgendaAvailableSlots(input.companyId, input.date, input.healthPlanId ?? null, input.durationMinutes ?? 30);
      }),
  }),

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    selectCompany: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserCompany(ctx.user.id, input.companyId);
        return { success: true };
      }),
  }),

  // ==================== COMPANIES ====================
  companies: router({
    /** Lista empresas apenas por busca por nome (admin global). Não retorna todas para não pesar. */
    list: protectedProcedure
      .input(z.object({ search: z.string().min(1).optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin_global") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas admin global pode listar empresas" });
        }
        const search = input?.search?.trim();
        if (!search || search.length < 2) {
          return [];
        }
        return await db.searchCompaniesByName(search, 50);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCompanyById(input.id);
      }),
  }),

  // ==================== WAITERS (GARÇONS) ====================
  waiters: router({
    list: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin_global" && ctx.user.companyId !== input.companyId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado a esta empresa" });
        }
        return await db.getWaitersByCompany(input.companyId);
      }),
    create: protectedProcedure
      .input(
        z.object({
          companyId: z.number(),
          email: z.string().email(),
          password: z.string().min(6),
          name: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin_global" && ctx.user.companyId !== input.companyId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado a esta empresa" });
        }
        const id = await db.createWaiter(
          input.companyId,
          input.email,
          input.password,
          input.name ?? input.email.split("@")[0]
        );
        return { id };
      }),
    remove: protectedProcedure
      .input(z.object({ companyId: z.number(), waiterId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin_global" && ctx.user.companyId !== input.companyId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado a esta empresa" });
        }
        await db.removeWaiter(input.waiterId, input.companyId);
        return { success: true };
      }),
  }),

  // ==================== TABLES ====================
  tables: router({
    list: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTablesByCompany(input.companyId);
      }),
    updateStatus: protectedProcedure
      .input(
        z.object({
          tableId: z.number(),
          status: z.enum(["available", "occupied", "reserved"]),
          orderId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateTableStatus(input.tableId, input.status, input.orderId);
        return { success: true };
      }),
    create: protectedProcedure
      .input(
        z.object({
          companyId: z.number(),
          number: z.string(),
          capacity: z.number().default(4),
        })
      )
      .mutation(async ({ input }) => {
        const id = await db.createTable({
          companyId: input.companyId,
          number: input.number,
          capacity: input.capacity,
          status: "available",
          currentOrderId: null,
        });
        return { id };
      }),
  }),

  // ==================== CATEGORIES ====================
  categories: router({
    list: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCategoriesByCompany(input.companyId);
      }),
    getAll: protectedProcedure.query(async () => {
      const companyId = 1; // TODO: Get from ctx.user.companyId
      return await db.getCategoriesByCompany(companyId);
    }),
  }),

  // ==================== PRODUCTS ====================
  products: router({
    list: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProductsByCompany(input.companyId);
      }),
    getAll: protectedProcedure
      .input(z.object({ includeInactive: z.boolean().optional() }))
      .query(async ({ ctx, input }) => {
        // Get company from context or first company
        const companyId = 1; // TODO: Get from ctx.user.companyId
        return await db.getAllProductsByCompany(companyId, input.includeInactive);
      }),
    listByCategory: protectedProcedure
      .input(z.object({ companyId: z.number(), categoryId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProductsByCategory(input.companyId, input.categoryId);
      }),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          price: z.number(),
          categoryId: z.number(),
          image: z.string().optional(),
          productionSector: z.string().optional(),
          preparationTime: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const companyId = 1; // TODO: Get from ctx.user.companyId
        const id = await db.createProduct({
          companyId,
          name: input.name,
          price: input.price.toFixed(2),
          categoryId: input.categoryId || null,
          description: input.description || null,
          image: input.image || null,
          isActive: true,
          productionSector: input.productionSector || null,
          preparationTime: input.preparationTime || 15,
        });
        return { id };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          price: z.number().optional(),
          categoryId: z.number().optional(),
          image: z.string().optional(),
          productionSector: z.string().optional(),
          preparationTime: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.price !== undefined) {
          updateData.price = data.price.toFixed(2);
        }
        await db.updateProduct(id, updateData);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.deleteProduct(input);
        return { success: true };
      }),
  }),

  // ==================== ORDERS ====================
  orders: router({
    create: protectedProcedure
      .input(
        z.object({
          companyId: z.number(),
          type: z.enum(["dine_in", "delivery", "takeout"]),
          tableId: z.number().optional(),
          customerName: z.string().optional(),
          customerPhone: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const orderNumber = `#${Date.now().toString().slice(-6)}`;
        const source = ctx.user.role === "waiter" ? "buscazap" : "pdv";
        const id = await db.createOrder({
          companyId: input.companyId,
          orderNumber,
          type: input.type,
          tableId: input.tableId || null,
          waiterId: ctx.user.id,
          customerName: input.customerName || null,
          customerPhone: input.customerPhone || null,
          status: "open",
          subtotal: "0.00",
          serviceCharge: "0.00",
          discount: "0.00",
          total: "0.00",
          notes: null,
          deliveryOrderId: null,
          source,
          closedAt: null,
        });
        try {
          const fullOrder = await db.getOrderById(id);
          if (fullOrder) {
            const { emitNewOrder } = await import("./_core/websocket");
            emitNewOrder(input.companyId, fullOrder);
          }
        } catch (e) {
          console.warn("[WebSocket] Failed to emit new-order:", e);
        }
        return { id, orderNumber };
      }),
    getById: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return await db.getOrderById(input.orderId);
      }),
    list: protectedProcedure
      .input(z.object({ companyId: z.number(), status: z.string().optional() }))
      .query(async ({ input }) => {
        return await db.getOrdersByCompany(input.companyId, input.status);
      }),
    updateStatus: protectedProcedure
      .input(z.object({ orderId: z.number(), status: z.string() }))
      .mutation(async ({ input }) => {
        await db.updateOrderStatus(input.orderId, input.status);
        return { success: true };
      }),
    updateTotal: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
          subtotal: z.string(),
          total: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateOrderTotal(input.orderId, input.subtotal, input.total);
        return { success: true };
      }),
    close: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input }) => {
        await db.closeOrder(input.orderId);
        return { success: true };
      }),
  }),

  // ==================== ORDER ITEMS ====================
  orderItems: router({
    add: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
          productId: z.number(),
          quantity: z.number(),
          unitPrice: z.string(),
          notes: z.string().optional(),
          productionSector: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const subtotal = (parseFloat(input.unitPrice) * input.quantity).toFixed(2);
        const id = await db.addOrderItem({
          orderId: input.orderId,
          productId: input.productId,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
          subtotal,
          notes: input.notes || null,
          status: "pending",
          productionSector: input.productionSector || null,
        });
        try {
          const order = await db.getOrderById(input.orderId);
          if (order) {
            const { emitOrderUpdated } = await import("./_core/websocket");
            emitOrderUpdated(order.companyId, input.orderId);
          }
        } catch (e) {
          console.warn("[WebSocket] Failed to emit order-updated:", e);
        }
        return { id };
      }),
    list: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return await db.getOrderItems(input.orderId);
      }),
    updateStatus: protectedProcedure
      .input(z.object({ itemId: z.number(), status: z.string() }))
      .mutation(async ({ input }) => {
        await db.updateOrderItemStatus(input.itemId, input.status);
        return { success: true };
      }),
  }),

  // ==================== PAYMENT METHODS ====================
  paymentMethods: router({
    list: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPaymentMethodsByCompany(input.companyId);
      }),
  }),

  // ==================== PAYMENTS ====================
  payments: router({
    add: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
          paymentMethodId: z.number(),
          amount: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await db.addPayment({
          orderId: input.orderId,
          paymentMethodId: input.paymentMethodId,
          amount: input.amount,
        });
        return { id };
      }),
    list: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPaymentsByOrder(input.orderId);
      }),
  }),

  // ==================== CASH REGISTER ====================
  cashRegister: router({
    open: protectedProcedure
      .input(
        z.object({
          companyId: z.number(),
          openingAmount: z.string(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.openCashRegister({
          companyId: input.companyId,
          userId: ctx.user.id,
          openingAmount: parseFloat(input.openingAmount),
        });
        return { id };
      }),
    getActive: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getOpenCashRegister(ctx.user.id);
      }),
    close: protectedProcedure
      .input(
        z.object({
          registerId: z.number(),
          closingAmount: z.string(),
          expectedAmount: z.string(),
          difference: z.string(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await db.closeCashRegister({
          cashRegisterId: input.registerId,
          closingAmount: parseFloat(input.closingAmount),
          expectedAmount: parseFloat(input.expectedAmount),
          notes: input.notes,
          closureDetails: [], // Será preenchido pelo frontend
        });
        return result;
      }),
    getSummary: protectedProcedure
      .input(z.object({ registerId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCashRegisterSummary(input.registerId);
      }),
  }),

  // ==================== CASH MOVEMENTS ====================
  cashMovements: router({
    add: protectedProcedure
      .input(
        z.object({
          cashRegisterId: z.number(),
          type: z.enum(["withdrawal", "deposit"]),
          amount: z.string(),
          reason: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.addCashMovement({
          cashRegisterId: input.cashRegisterId,
          type: input.type,
          amount: parseFloat(input.amount),
          reason: input.reason,
          userId: ctx.user.id,
        });
        return { id };
      }),
    list: protectedProcedure
      .input(z.object({ registerId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCashMovements(input.registerId);
      }),
  }),

  // ==================== BILL SPLITS ====================
  billSplits: router({
    create: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
          numberOfPeople: z.number(),
          amountPerPerson: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await db.createBillSplit(
          input.orderId,
          input.numberOfPeople,
          input.amountPerPerson
        );
        return { id };
      }),
    get: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return await db.getBillSplit(input.orderId);
      }),
  }),

  // ==================== PRINTERS ====================
  printers: router({
    list: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPrintersByCompany(input.companyId);
      }),
    getBySector: protectedProcedure
      .input(z.object({ companyId: z.number(), sector: z.string() }))
      .query(async ({ input }) => {
        return await db.getPrinterBySector(input.companyId, input.sector);
      }),
  }),

  // ==================== DELIVERY REQUESTS ====================
  deliveryRequests: router({
    create: protectedProcedure
      .input(
        z.object({
          companyId: z.number(),
          orderId: z.number(),
          customerName: z.string(),
          customerPhone: z.string(),
          deliveryAddress: z.string(),
          deliveryFee: z.string(),
          // Se a empresa tiver entregadores próprios, o PDV pode optar por
          // usar entregadores próprios (true) ou o pool global da cidade (false/undefined).
          useOwnDrivers: z.boolean().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const settings = await db.getCompanyDeliverySettings(input.companyId);
        const deliveryType =
          settings.hasOwnDrivers && input.useOwnDrivers === true ? "company" : "city";

        const id = await db.createDeliveryRequest({
          companyId: input.companyId,
          orderId: input.orderId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          deliveryAddress: input.deliveryAddress,
          deliveryFee: input.deliveryFee,
          deliveryType,
          status: "pending",
          deliveryPersonId: null,
          deliveryPersonName: null,
          notes: input.notes || null,
        });
        return { id };
      }),
    list: protectedProcedure
      .input(z.object({ companyId: z.number(), status: z.string().optional() }))
      .query(async ({ input }) => {
        return await db.getDeliveryRequestsByCompany(input.companyId, input.status);
      }),
    updateStatus: protectedProcedure
      .input(
        z.object({
          requestId: z.number(),
          status: z.string(),
          deliveryPersonId: z.number().optional(),
          deliveryPersonName: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateDeliveryRequestStatus(
          input.requestId,
          input.status,
          input.deliveryPersonId,
          input.deliveryPersonName
        );
        return { success: true };
      }),
    getById: protectedProcedure
      .input(z.object({ requestId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDeliveryRequestById(input.requestId);
      }),
   }),

  // ==================== SMART DELIVERY (POOL GLOBAL) ====================
  smartDelivery: router({
    // Lista priorizada do pool global (cidade). Não mistura com entregadores próprios.
    getPendingOrdersPrioritized: protectedProcedure
      .input(z.object({ cityId: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== "delivery_driver" && ctx.user?.role !== "admin_global") {
          throw new Error("Acesso negado");
        }

        return await db.getPendingOrdersPrioritized(input?.cityId);
      }),
  }),

  // Notificações
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return [] as Array<{
        id: string;
        title: string;
        message: string;
        type: 'order' | 'delivery' | 'promotion' | 'system';
        read: boolean;
        createdAt: Date;
        data?: Record<string, any>;
      }>;
    }),
    markAsRead: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return { success: true };
      }),
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      return { success: true };
      }),
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      return {
        pushEnabled: true,
        emailEnabled: true,
        orderUpdates: true,
        promotions: true,
      };
    }),
    updateSettings: protectedProcedure
      .input(
        z.object({
          pushEnabled: z.boolean().optional(),
          emailEnabled: z.boolean().optional(),
          orderUpdates: z.boolean().optional(),
          promotions: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return { success: true };
      }),
  }),

  // Cupons
  coupons: router({
    myAvailable: protectedProcedure.query(async ({ ctx }) => {
      return [] as Array<{
        id: number;
        code: string;
        type: 'percentage' | 'fixed';
        value: number;
        description: string;
        minOrderValue: number | null;
        validUntil: Date;
        usageLimit: number | null;
        usageCount: number;
        isActive: boolean;
      }>;
    }),
  }),

  // Programa de Fidelidade
  loyalty: router({
    getPoints: protectedProcedure.query(async ({ ctx }) => {
      return {
        points: 0,
        level: 'bronze',
        nextLevelPoints: 100,
      };
    }),
    getMyPoints: protectedProcedure.query(async ({ ctx }) => {
      return {
        points: 0,
        level: 'bronze',
        nextLevelPoints: 100,
      };
    }),
    getHistory: protectedProcedure.query(async ({ ctx }) => {
      return [] as Array<{
        id: number;
        points: number;
        type: 'earned' | 'redeemed';
        description: string;
        createdAt: Date;
      }>;
    }),
    addPoints: protectedProcedure
      .input(z.object({ points: z.number(), orderId: z.string() }))
      .mutation(async ({ input }) => {
        return { success: true, newTotal: input.points };
      }),
  }),

  // Mensagens/Chat
  messages: router({
    list: protectedProcedure
      .input(z.object({ conversationId: z.string() }))
      .query(async ({ input }) => {
        return [];
      }),
    send: protectedProcedure
      .input(
        z.object({
          conversationId: z.string(),
          content: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return { success: true, messageId: 'temp-id' };
      }),
  }),

  // Avaliações
  reviews: router({
    list: protectedProcedure
      .input(z.object({ companyId: z.string() }))
      .query(async ({ input }) => {
        return [];
      }),
    create: protectedProcedure
      .input(
        z.object({
          orderId: z.string(),
          rating: z.number().min(1).max(5),
          comment: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return { success: true };
      }),
  }),

  // Analytics
  analytics: router({
    track: protectedProcedure
      .input(
        z.object({
          event: z.string(),
          properties: z.record(z.string(), z.any()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        return { success: true };
      }),
    getCompanyStats: protectedProcedure
      .input(z.object({ period: z.enum(['day', 'week', 'month', 'year']) }))
      .query(async ({ input }) => {
        return {
          revenue: 0,
          revenueTrend: 0,
          orders: 0,
          totalOrders: 0,
          ordersTrend: 0,
          customers: 0,
          newCustomers: 0,
          newCustomersTrend: 0,
          averageTicket: 0,
          averageRating: 0,
          totalReviews: 0,
          topProducts: [] as Array<{ id: number; name: string; quantity: number; revenue: number }>,
          recentOrders: [] as Array<{ id: number; customerName: string; total: number; status: string; createdAt: Date }>,
          salesByPeriod: [] as Array<{ period: string; revenue: number; orders: number; label: string; value: number }>,
          peakHours: [] as Array<{ hour: number; orders: number }>,
          ordersByStatus: [] as Array<{ status: string; count: number; percentage: number }>,
        };
      }),
  }),

  // Conversas/Chat
  conversations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return [] as Array<{
        id: number;
        otherParticipantName: string;
        otherParticipantAvatar: string | null;
        lastMessage: string;
        lastMessageTime: Date;
        unreadCount: number;
      }>;
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return null;
      }),
  }),

  // Saques (para entregadores)
  withdrawals: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return [];
    }),
    create: protectedProcedure
      .input(
        z.object({
          amount: z.number(),
          bankAccountId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return { success: true, withdrawalId: 'temp-id' };
      }),
    getBalance: protectedProcedure.query(async ({ ctx }) => {
      return { available: 0, pending: 0, total: 0 };
    }),
  }),

  // Contas bancárias
  bankAccounts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return [];
    }),
    create: protectedProcedure
      .input(
        z.object({
          bankName: z.string(),
          accountType: z.enum(['checking', 'savings']),
          accountNumber: z.string(),
          agency: z.string(),
          holderName: z.string(),
          holderDocument: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return { success: true, accountId: 'temp-id' };
      }),
  }),

  // Usuários
  users: router({
    updatePushToken: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input, ctx }) => {
        return { success: true };
      }),
  }),

  // ==================== INTEGRAÇÃO BUSCAZAP ====================
  buscazapIntegration: router({
    // Criar pedido vindo do BuscaZap
    createOrder: publicProcedure
      .input(
        z.object({
          companyId: z.number(),
          deliveryOrderId: z.string(),
          customerName: z.string(),
          customerPhone: z.string(),
          items: z.array(
            z.object({
              productId: z.number(),
              quantity: z.number(),
              unitPrice: z.string(),
              notes: z.string().optional(),
            })
          ),
          deliveryAddress: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createOrderFromBuscaZap(input);
      }),

    // Listar pedidos do BuscaZap
    listOrders: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getBuscaZapOrders(input.companyId);
      }),

    // Aceitar pedido
    acceptOrder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input }) => {
        const result = await db.acceptBuscaZapOrder(input.orderId);
        // Imprimir automaticamente ao aceitar
        await db.printOrder(input.orderId);
        // Notificar cliente
        await db.notifyOrderStatus(input.orderId, "sent_to_kitchen");
        return result;
      }),

    // Rejeitar pedido
    rejectOrder: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.rejectBuscaZapOrder(input.orderId, input.reason);
      }),

    // Atualizar status do pedido
    updateStatus: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
          status: z.enum(["preparing", "ready", "closed"]),
        })
      )
      .mutation(async ({ input }) => {
        const result = await db.updateBuscaZapOrderStatus(input.orderId, input.status);
        // Notificar cliente sobre mudança de status
        await db.notifyOrderStatus(input.orderId, input.status);
        return result;
      }),
  }),

  // ==================== INTEGRAÇÃO PLATAFORMAS EXTERNAS (UNIFICADO) ====================
  externalPlatforms: router({
    // Receber pedido de qualquer plataforma externa (webhook genérico)
    receiveOrder: publicProcedure
      .input(
        z.object({
          companyId: z.number(),
          platform: z.enum(["pedija", "iffod", "99food", "rappi", "uber_eats", "ifood", "other"]),
          externalOrderId: z.string(),
          customerName: z.string(),
          customerPhone: z.string(),
          items: z.array(
            z.object({
              productId: z.number().optional(),
              productName: z.string(),
              quantity: z.number(),
              unitPrice: z.string(),
              notes: z.string().optional(),
            })
          ),
          deliveryAddress: z.string().optional(),
          deliveryFee: z.string().optional(),
          subtotal: z.string().optional(),
          total: z.string().optional(),
          notes: z.string().optional(),
          paymentMethod: z.string().optional(),
          // Validação de webhook (opcional)
          webhookSecret: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Validar webhook secret se fornecido
        if (input.webhookSecret) {
          const integration = await db.getExternalPlatformIntegrations(input.companyId);
          const platformIntegration = integration.find((i) => i.platform === input.platform);
          
          if (platformIntegration?.webhookSecret && platformIntegration.webhookSecret !== input.webhookSecret) {
            throw new Error("Webhook secret inválido");
          }
        }

        return await db.createOrderFromExternalPlatform({
          companyId: input.companyId,
          platform: input.platform,
          externalOrderId: input.externalOrderId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          items: input.items,
          deliveryAddress: input.deliveryAddress,
          deliveryFee: input.deliveryFee,
          subtotal: input.subtotal,
          total: input.total,
          notes: input.notes,
          paymentMethod: input.paymentMethod,
        });
      }),

    // Webhook específico para Pedijá
    receivePedijaOrder: publicProcedure
      .input(
        z.object({
          companyId: z.number(),
          orderId: z.string(),
          customer: z.object({
            name: z.string(),
            phone: z.string(),
          }),
          items: z.array(
            z.object({
              name: z.string(),
              quantity: z.number(),
              price: z.string(),
              notes: z.string().optional(),
            })
          ),
          delivery: z.object({
            address: z.string(),
            fee: z.string().optional(),
          }),
          total: z.string(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createOrderFromExternalPlatform({
          companyId: input.companyId,
          platform: "pedija",
          externalOrderId: input.orderId,
          customerName: input.customer.name,
          customerPhone: input.customer.phone,
          items: input.items.map((item) => ({
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            notes: item.notes,
          })),
          deliveryAddress: input.delivery.address,
          deliveryFee: input.delivery.fee,
          total: input.total,
          notes: input.notes,
        });
      }),

    // Webhook específico para Iffod
    receiveIffodOrder: publicProcedure
      .input(
        z.object({
          companyId: z.number(),
          orderId: z.string(),
          customerName: z.string(),
          customerPhone: z.string(),
          items: z.array(
            z.object({
              name: z.string(),
              quantity: z.number(),
              price: z.string(),
            })
          ),
          deliveryAddress: z.string(),
          total: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createOrderFromExternalPlatform({
          companyId: input.companyId,
          platform: "iffod",
          externalOrderId: input.orderId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          items: input.items.map((item) => ({
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
          deliveryAddress: input.deliveryAddress,
          total: input.total,
        });
      }),

    // Listar todos os pedidos externos (unificado)
    listAllExternalOrders: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAllExternalOrders(input.companyId);
      }),

    // Gerenciar integrações
    upsertIntegration: protectedProcedure
      .input(
        z.object({
          companyId: z.number(),
          platform: z.enum(["pedija", "iffod", "99food", "rappi", "uber_eats", "ifood", "other"]),
          apiKey: z.string().optional(),
          apiSecret: z.string().optional(),
          webhookSecret: z.string().optional(),
          settings: z
            .object({
              autoAccept: z.boolean().optional(),
              autoPrint: z.boolean().optional(),
              notificationSound: z.boolean().optional(),
            })
            .optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin_global" && ctx.user?.companyId !== input.companyId) {
          throw new Error("Acesso negado");
        }
        return await db.upsertExternalPlatformIntegration(input);
      }),

    listIntegrations: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin_global" && ctx.user?.companyId !== input.companyId) {
          throw new Error("Acesso negado");
        }
        return await db.getExternalPlatformIntegrations(input.companyId);
      }),

    toggleIntegration: protectedProcedure
      .input(
        z.object({
          companyId: z.number(),
          platform: z.string(),
          isActive: z.boolean(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin_global" && ctx.user?.companyId !== input.companyId) {
          throw new Error("Acesso negado");
        }
        return await db.toggleExternalPlatformIntegration(
          input.companyId,
          input.platform,
          input.isActive
        );
      }),
  }),

  // ==================== SINCRONIZAÇÃO DE CARDÁPIO ====================
  productSync: router({
    // Sincronizar produtos do BuscaZap
    sync: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.syncProductsFromBuscaZap(input.companyId);
      }),

    // Verificar status de sincronização
    checkStatus: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await db.checkProductSync(input.companyId);
      }),
  }),

  // ==================== IMPRESSÃO ====================
  printing: router({
    // Imprimir pedido
    printOrder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.printOrder(input.orderId);
      }),

    // Buscar impressora da cozinha
    getKitchenPrinter: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getKitchenPrinter(input.companyId);
      }),
  }),

  // ==================== ESTATÍSTICAS BUSCAZAP ====================
  buscazapStats: router({
    // Buscar estatísticas gerais
    getStats: protectedProcedure
      .input(
        z.object({
          companyId: z.number(),
          period: z.enum(["today", "week", "month"]),
        })
      )
      .query(async ({ input }) => {
        return await db.getBuscaZapStats(input.companyId, input.period);
      }),

    // Buscar pedidos por horário
    getOrdersByHour: protectedProcedure
      .input(
        z.object({
          companyId: z.number(),
          period: z.enum(["today", "week", "month"]),
        })
      )
      .query(async ({ input }) => {
        return await db.getOrdersByHour(input.companyId, input.period);
      }),

    // Buscar pedidos por dia da semana
    getOrdersByWeekday: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getOrdersByWeekday(input.companyId);
      }),
  }),

  // ==================== CHAT ====================
  chat: router({
    // Enviar mensagem
    sendMessage: publicProcedure
      .input(
        z.object({
          orderId: z.number(),
          senderId: z.number(),
          senderType: z.enum(["customer", "business"]),
          message: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        return await db.sendChatMessage(input);
      }),

    // Buscar mensagens
    getMessages: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return await db.getChatMessages(input.orderId);
      }),

    // Marcar como lidas
    markAsRead: publicProcedure
      .input(
        z.object({
          orderId: z.number(),
          senderType: z.enum(["customer", "business"]),
        })
      )
      .mutation(async ({ input }) => {
        return await db.markMessagesAsRead(input.orderId, input.senderType);
      }),

    // Contar não lidas
    getUnreadCount: publicProcedure
      .input(
        z.object({
          orderId: z.number(),
          forType: z.enum(["customer", "business"]),
        })
      )
      .query(async ({ input }) => {
        return await db.getUnreadCount(input.orderId, input.forType);
      }),
  }),

  // ==================== AVALIAÇÕES ====================
  ratings: router({
    // Criar avaliação
    create: publicProcedure
      .input(
        z.object({
          orderId: z.number(),
          customerId: z.number(),
          companyId: z.number(),
          rating: z.number().min(1).max(5),
          comment: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createOrderRating(input);
      }),

    // Buscar avaliação de um pedido
    getByOrder: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return await db.getOrderRating(input.orderId);
      }),

    // Buscar avaliações da empresa
    getByCompany: protectedProcedure
      .input(
        z.object({
          companyId: z.number(),
          limit: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.getCompanyRatings(input.companyId, input.limit);
      }),

    // Estatísticas de avaliações
    getStats: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCompanyRatingStats(input.companyId);
      }),
  }),

  // ==================== DELIVERY E ENTREGADORES PRÓPRIOS ====================
  delivery: router({
    // Buscar configurações de delivery da empresa
    getSettings: protectedProcedure
      .input(z.object({ companyId: z.number().optional() }).optional())
      .query(async ({ input, ctx }) => {
        const effectiveCompanyId = ctx.user?.role === 'admin_global' && input?.companyId != null
          ? input.companyId
          : (ctx.user?.companyId ?? ctx.user?.id);
        if (effectiveCompanyId == null) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Company não identificada' });
        }
        return await db.getCompanyDeliverySettings(effectiveCompanyId);
      }),
    
    // Ativar empresa no PediJá
    activateOnPedija: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Verificar se é admin ou dono da empresa
        if (ctx.user?.role !== 'admin_global' && ctx.user?.companyId !== input.companyId) {
          throw new Error('Acesso negado');
        }
        
        return await db.activateCompanyOnPedija(input.companyId);
      }),
    
    // Desativar empresa do PediJá
    deactivateFromPedija: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin_global' && ctx.user?.companyId !== input.companyId) {
          throw new Error('Acesso negado');
        }
        
        return await db.deactivateCompanyFromPedija(input.companyId);
      }),
    
    // Ativar/desativar status online para pedidos (via PDV)
    toggleOnlineStatus: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        isOnline: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin_global' && ctx.user?.companyId !== input.companyId) {
          throw new Error('Acesso negado');
        }
        
        return await db.toggleCompanyOnlineStatus(input.companyId, input.isOnline);
      }),
    
    // Buscar empresas online no PediJá
    getOnlineCompanies: publicProcedure
      .input(z.object({
        cityId: z.number().optional(),
        neighborhood: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getOnlineCompaniesForDelivery(input.cityId, input.neighborhood);
      }),
    
    // Adicionar entregador próprio
    addDriver: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        driverId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin_global' && ctx.user?.companyId !== input.companyId) {
          throw new Error('Acesso negado');
        }
        
        return await db.addCompanyDriver(input.companyId, input.driverId);
      }),
    
    // Remover entregador próprio
    removeDriver: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        driverId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin_global' && ctx.user?.companyId !== input.companyId) {
          throw new Error('Acesso negado');
        }
        
        return await db.removeCompanyDriver(input.companyId, input.driverId);
      }),
    
    // Buscar entregadores da empresa
    getDrivers: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin_global' && ctx.user?.companyId !== input.companyId) {
          throw new Error('Acesso negado');
        }
        
        return await db.getCompanyDrivers(input.companyId);
      }),
    
    // Buscar pedidos para entregador próprio
    getOrdersForDriver: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user?.role !== 'delivery_driver') {
          throw new Error('Acesso negado');
        }
        
        return await db.getOrdersForCompanyDriver(ctx.user.id);
      }),
    
    // Habilitar entregadores próprios no plano (admin global para qualquer empresa; company para a própria)
    enableOwnDrivers: protectedProcedure
      .input(z.object({
        companyId: z.number().optional(),
        maxDrivers: z.number().min(1).max(50),
      }))
      .mutation(async ({ input, ctx }) => {
        const effectiveCompanyId = ctx.user?.role === 'admin_global' && input.companyId != null
          ? input.companyId
          : (ctx.user?.companyId ?? ctx.user?.id);
        if (effectiveCompanyId == null) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Company não identificada' });
        }
        if (ctx.user?.role !== 'admin_global' && (ctx.user?.companyId ?? ctx.user?.id) !== effectiveCompanyId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }
        return await db.upsertCompanyDeliverySettings({
          companyId: effectiveCompanyId,
          hasOwnDrivers: true,
          maxDrivers: input.maxDrivers,
        });
      }),
    
    // Desabilitar entregadores próprios
    disableOwnDrivers: protectedProcedure
      .input(z.object({ companyId: z.number().optional() }).optional())
      .mutation(async ({ input, ctx }) => {
        const effectiveCompanyId = ctx.user?.role === 'admin_global' && input?.companyId != null
          ? input.companyId
          : (ctx.user?.companyId ?? ctx.user?.id);
        if (effectiveCompanyId == null) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Company não identificada' });
        }
        if (ctx.user?.role !== 'admin_global' && (ctx.user?.companyId ?? ctx.user?.id) !== effectiveCompanyId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }
        return await db.upsertCompanyDeliverySettings({
          companyId: effectiveCompanyId,
          hasOwnDrivers: false,
          maxDrivers: 0,
        });
      }),
  }),

  // ==================== VERIFICAÇÃO DE PLANO ====================
  plan: router({
    // Verificar se usuário tem plano ativo
    checkPlan: publicProcedure
      .input(z.object({ userId: z.string() }))
      .query(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        if (!user) {
          return { hasActivePlan: false, message: "Usuário não encontrado" };
        }

        // Verificar se o usuário tem plano destaque ativo
        const hasActivePlan = user.planType === 'destaque' && 
                              user.planExpiresAt && 
                              new Date(user.planExpiresAt) > new Date();

        return { 
          hasActivePlan,
          planType: user.planType || null,
          planExpiresAt: user.planExpiresAt || null,
          message: hasActivePlan ? "Plano ativo" : "Sem plano ativo"
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
