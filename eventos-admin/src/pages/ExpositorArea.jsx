import { useState, useEffect } from "react";
import {
  getExpositorMe,
  updateExpositorMe,
  uploadExpositorImage,
  uploadExpositorArquivo,
  listExpositorArquivos,
  deleteExpositorArquivo,
  listExpositorCards,
  createExpositorCard,
  deleteExpositorCard,
  listExpositorKnowledge,
  createExpositorKnowledgeTexto,
  createExpositorKnowledgeArquivo,
  deleteExpositorKnowledge,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function ExpositorArea() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingTitulo, setUploadingTitulo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [form, setForm] = useState({
    logoUrl: "",
    imagemTituloUrl: "",
    bannerUrl: "",
    descricao: "",
    site: "",
    instagram: "",
    linkedin: "",
  });

  const [arquivos, setArquivos] = useState([]);
  const [cards, setCards] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [uploadingArquivo, setUploadingArquivo] = useState(false);
  const [creatingCard, setCreatingCard] = useState(false);
  const [creatingTexto, setCreatingTexto] = useState(false);
  const [creatingFromFile, setCreatingFromFile] = useState(false);
  const [cardForm, setCardForm] = useState({ titulo: "", descricao: "", arquivoId: "" });
  const [textoForm, setTextoForm] = useState({ titulo: "", conteudo: "" });
  const [arquivoKnowledgeId, setArquivoKnowledgeId] = useState("");

  const load = () => {
    getExpositorMe()
      .then((d) => {
        setData(d);
        setForm({
          logoUrl: d.logoUrl || "",
          imagemTituloUrl: d.imagemTituloUrl || "",
          bannerUrl: d.bannerUrl || "",
          descricao: d.descricao || "",
          site: d.site || "",
          instagram: d.instagram || "",
          linkedin: d.linkedin || "",
        });
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  const loadArquivos = () => {
    listExpositorArquivos()
      .then(setArquivos)
      .catch(() => setArquivos([]));
  };

  const loadCards = () => {
    listExpositorCards()
      .then(setCards)
      .catch(() => setCards([]));
  };

  const loadKnowledge = () => {
    listExpositorKnowledge()
      .then(setKnowledge)
      .catch(() => setKnowledge([]));
  };

  useEffect(() => {
    load();
    loadArquivos();
    loadCards();
    loadKnowledge();
  }, []);

  const handleUpload = async (field, tipo, file) => {
    if (!file?.type?.startsWith("image/")) {
      alert("Selecione uma imagem (JPG, PNG, etc.).");
      return;
    }
    const setters = { logoUrl: setUploadingLogo, imagemTituloUrl: setUploadingTitulo, bannerUrl: setUploadingBanner };
    setters[field](true);
    try {
      const res = await uploadExpositorImage(file, tipo);
      setForm((prev) => ({ ...prev, [field]: res.url }));
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao enviar imagem.");
    } finally {
      setters[field](false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateExpositorMe(form);
      alert("Dados atualizados com sucesso.");
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadArquivo = async (file) => {
    if (!file) return;
    setUploadingArquivo(true);
    try {
      await uploadExpositorArquivo(file, { tipo: "catalogo" });
      loadArquivos();
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao enviar arquivo.");
    } finally {
      setUploadingArquivo(false);
    }
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();
    if (!cardForm.titulo.trim()) {
      alert("Informe o título do card.");
      return;
    }
    setCreatingCard(true);
    try {
      const payload = {
        titulo: cardForm.titulo.trim(),
        descricao: cardForm.descricao || "",
      };
      if (cardForm.arquivoId) payload.arquivoId = Number(cardForm.arquivoId);
      await createExpositorCard(payload);
      setCardForm({ titulo: "", descricao: "", arquivoId: "" });
      loadCards();
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao criar card.");
    } finally {
      setCreatingCard(false);
    }
  };

  const handleDeleteCard = async (id) => {
    if (!window.confirm("Remover este card?")) return;
    try {
      await deleteExpositorCard(id);
      loadCards();
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao remover card.");
    }
  };

  const handleCreateTexto = async (e) => {
    e.preventDefault();
    if (!textoForm.titulo.trim() || !textoForm.conteudo.trim()) {
      alert("Preencha título e conteúdo.");
      return;
    }
    setCreatingTexto(true);
    try {
      await createExpositorKnowledgeTexto({
        titulo: textoForm.titulo.trim(),
        conteudo: textoForm.conteudo.trim(),
      });
      setTextoForm({ titulo: "", conteudo: "" });
      loadKnowledge();
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao salvar conteúdo.");
    } finally {
      setCreatingTexto(false);
    }
  };

  const handleCreateFromFile = async (e) => {
    e.preventDefault();
    if (!arquivoKnowledgeId) {
      alert("Selecione um arquivo.");
      return;
    }
    setCreatingFromFile(true);
    try {
      await createExpositorKnowledgeArquivo({
        arquivoId: Number(arquivoKnowledgeId),
      });
      setArquivoKnowledgeId("");
      loadKnowledge();
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao vincular arquivo.");
    } finally {
      setCreatingFromFile(false);
    }
  };

  const handleDeleteKnowledge = async (id) => {
    if (!window.confirm("Remover este item de conhecimento?")) return;
    try {
      await deleteExpositorKnowledge(id);
      loadKnowledge();
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao remover item.");
    }
  };

  const handleDeleteArquivo = async (id) => {
    if (!window.confirm("Remover este arquivo? (se estiver em uso em cards, eles perderão a imagem)")) return;
    try {
      await deleteExpositorArquivo(id);
      loadArquivos();
      loadCards();
      loadKnowledge();
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao remover arquivo.");
    }
  };

  if (loading)
    return (
      <div className="container" style={{ padding: "2rem", textAlign: "center" }}>
        Carregando...
      </div>
    );
  if (!data) return <div className="container">Erro ao carregar dados. <a href="/expositor/login">Fazer login novamente</a>.</div>;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          background: "#166534",
          color: "#fff",
          padding: "0.75rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ fontWeight: "700", fontSize: "1.1rem" }}>🏪 Área do Expositor</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.875rem" }}>{data.nome}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={logout}>
            Sair
          </button>
        </div>
      </header>
      <main style={{ flex: 1, padding: "1.5rem", maxWidth: 960, margin: "0 auto", width: "100%" }}>
        <h1 style={{ marginBottom: "0.5rem" }}>Configuração da sua página na feira</h1>
        <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
          Aqui você gerencia as imagens, o texto da sua página, os cards de produtos/serviços e os materiais que o bot usa para responder visitantes.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)", gap: "1.5rem", alignItems: "flex-start" }}>
          <div className="card">
            <form onSubmit={handleSave}>
              <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Imagens principais</h2>
              <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1rem" }}>
                Logo, imagem de título e banner (patrocinador) usados na área da feira do app BuscaZap.
              </p>
              <div className="form-group">
                <label>Logo (pins do mapa)</label>
                {form.logoUrl && (
                  <div style={{ marginBottom: "0.5rem" }}>
                    <img
                      src={form.logoUrl}
                      alt="Logo"
                      style={{
                        maxWidth: 80,
                        maxHeight: 80,
                        objectFit: "contain",
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                      }}
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingLogo}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload("logoUrl", "logo", f);
                    e.target.value = "";
                  }}
                  style={{ maxWidth: "100%" }}
                />
                {uploadingLogo && (
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}> Enviando...</span>
                )}
              </div>
              <div className="form-group">
                <label>Imagem do título (cabeçalho da página no app)</label>
                {form.imagemTituloUrl && (
                  <div style={{ marginBottom: "0.5rem" }}>
                    <img
                      src={form.imagemTituloUrl}
                      alt="Título"
                      style={{
                        maxWidth: "100%",
                        maxHeight: 120,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                      }}
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingTitulo}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload("imagemTituloUrl", "titulo", f);
                    e.target.value = "";
                  }}
                  style={{ maxWidth: "100%" }}
                />
                {uploadingTitulo && (
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}> Enviando...</span>
                )}
              </div>
              {data.patrocinado && (
                <div className="form-group">
                  <label>Banner (patrocinador oficial no mapa)</label>
                  {form.bannerUrl && (
                    <div style={{ marginBottom: "0.5rem" }}>
                      <img
                        src={form.bannerUrl}
                        alt="Banner"
                        style={{
                          maxWidth: "100%",
                          maxHeight: 80,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                        }}
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingBanner}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload("bannerUrl", "banner", f);
                      e.target.value = "";
                    }}
                    style={{ maxWidth: "100%" }}
                  />
                  {uploadingBanner && (
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}> Enviando...</span>
                  )}
                </div>
              )}

              <hr style={{ margin: "1.25rem 0", border: "none", borderTop: "1px solid #e2e8f0" }} />
              <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Texto e links da página</h2>
              <div className="form-group">
                <label>Descrição da empresa (aparece na página da feira)</label>
                <textarea
                  rows={4}
                  value={form.descricao}
                  onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Conte, em poucas linhas, o que a sua empresa faz, diferenciais e principais soluções."
                />
              </div>
              <div className="form-group">
                <label>Site</label>
                <input
                  value={form.site}
                  onChange={(e) => setForm((prev) => ({ ...prev, site: e.target.value }))}
                  placeholder="https://suaempresa.com.br"
                />
              </div>
              <div className="form-group">
                <label>Instagram</label>
                <input
                  value={form.instagram}
                  onChange={(e) => setForm((prev) => ({ ...prev, instagram: e.target.value }))}
                  placeholder="https://instagram.com/suaempresa"
                />
              </div>
              <div className="form-group">
                <label>LinkedIn</label>
                <input
                  value={form.linkedin}
                  onChange={(e) => setForm((prev) => ({ ...prev, linkedin: e.target.value }))}
                  placeholder="https://linkedin.com/company/suaempresa"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ marginTop: "1rem" }}
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </form>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="card">
              <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Catálogos e arquivos</h2>
              <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                Envie PDFs, apresentações ou imagens. Eles podem ser exibidos na sua página e usados para treinar o bot.
              </p>
              <div className="form-group">
                <input
                  type="file"
                  disabled={uploadingArquivo}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadArquivo(f);
                    e.target.value = "";
                  }}
                />
                {uploadingArquivo && (
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}> Enviando...</span>
                )}
              </div>
              {arquivos.length > 0 && (
                <ul style={{ listStyle: "none", padding: 0, marginTop: "0.75rem", maxHeight: 200, overflowY: "auto" }}>
                  {arquivos.map((arq) => (
                    <li
                      key={arq.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.5rem",
                        padding: "0.25rem 0",
                        borderBottom: "1px solid #e2e8f0",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                          {arq.titulo}
                        </div>
                        <div style={{ color: "#64748b" }}>{arq.tipo}</div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => window.open(arq.url, "_blank")}
                      >
                        Abrir
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteArquivo(arq.id)}
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {arquivos.length === 0 && (
                <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Nenhum arquivo enviado ainda.</p>
              )}
            </div>

            <div className="card">
              <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Treinamento da IA</h2>
              <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                Adicione textos e vincule arquivos importantes para que o bot saiba explicar bem sua empresa e seus produtos.
              </p>

              <form onSubmit={handleCreateTexto} style={{ marginBottom: "0.75rem" }}>
                <div className="form-group">
                  <label>Título do conteúdo</label>
                  <input
                    value={textoForm.titulo}
                    onChange={(e) =>
                      setTextoForm((prev) => ({ ...prev, titulo: e.target.value }))
                    }
                    placeholder="Ex: Sobre a empresa, Linha de produtos, Política comercial"
                  />
                </div>
                <div className="form-group">
                  <label>Conteúdo (o que o bot deve aprender)</label>
                  <textarea
                    rows={4}
                    value={textoForm.conteudo}
                    onChange={(e) =>
                      setTextoForm((prev) => ({ ...prev, conteudo: e.target.value }))
                    }
                    placeholder="Descreva de forma clara o que o bot deve saber responder sobre este tema."
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={creatingTexto}
                >
                  {creatingTexto ? "Salvando..." : "Adicionar conteúdo"}
                </button>
              </form>

              <form onSubmit={handleCreateFromFile} style={{ marginBottom: "0.75rem" }}>
                <div className="form-group">
                  <label>Vincular arquivo à base de conhecimento</label>
                  <select
                    value={arquivoKnowledgeId}
                    onChange={(e) => setArquivoKnowledgeId(e.target.value)}
                  >
                    <option value="">Selecione um arquivo enviado</option>
                    {arquivos.map((arq) => (
                      <option key={arq.id} value={arq.id}>
                        {arq.titulo}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="btn btn-secondary btn-sm"
                  disabled={creatingFromFile || arquivos.length === 0}
                >
                  {creatingFromFile ? "Processando..." : "Adicionar a partir do arquivo"}
                </button>
              </form>

              {knowledge.length > 0 && (
                <ul style={{ listStyle: "none", padding: 0, marginTop: "0.5rem", maxHeight: 180, overflowY: "auto" }}>
                  {knowledge.map((k) => (
                    <li
                      key={k.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.5rem",
                        padding: "0.25rem 0",
                        borderBottom: "1px solid #e2e8f0",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                          }}
                        >
                          {k.titulo}
                        </div>
                        <div style={{ color: "#64748b" }}>
                          {k.origem === "arquivo" ? "A partir de arquivo" : "Texto direto"}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteKnowledge(k.id)}
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {knowledge.length === 0 && (
                <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                  Nenhum conteúdo cadastrado ainda. Quanto mais contexto você adicionar aqui, melhor o bot vai explicar sua empresa.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>
            Cards de produtos, serviços e destaques
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
            Estes cards aparecem na sua página na feira. Use para destacar produtos, serviços ou benefícios importantes.
          </p>

          <form onSubmit={handleCreateCard} style={{ marginBottom: "1rem" }}>
            <div className="form-group">
              <label>Título do card *</label>
              <input
                value={cardForm.titulo}
                onChange={(e) =>
                  setCardForm((prev) => ({ ...prev, titulo: e.target.value }))
                }
                placeholder="Ex: Linha de tratores Série X"
                required
              />
            </div>
            <div className="form-group">
              <label>Descrição (opcional)</label>
              <textarea
                rows={3}
                value={cardForm.descricao}
                onChange={(e) =>
                  setCardForm((prev) => ({ ...prev, descricao: e.target.value }))
                }
                placeholder="Resumo curto do produto, benefício ou condição especial."
              />
            </div>
            <div className="form-group">
              <label>Imagem (arquivo enviado)</label>
              <select
                value={cardForm.arquivoId}
                onChange={(e) =>
                  setCardForm((prev) => ({ ...prev, arquivoId: e.target.value }))
                }
              >
                <option value="">Sem imagem</option>
                {arquivos.map((arq) => (
                  <option key={arq.id} value={arq.id}>
                    {arq.titulo}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={creatingCard}
            >
              {creatingCard ? "Adicionando..." : "Adicionar card"}
            </button>
          </form>

          {cards.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1rem",
              }}
            >
              {cards.map((card) => (
                <div
                  key={card.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "0.75rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {card.imagemUrl && (
                    <div>
                      <img
                        src={card.imagemUrl}
                        alt={card.titulo}
                        style={{
                          width: "100%",
                          maxHeight: 140,
                          objectFit: "cover",
                          borderRadius: 6,
                          border: "1px solid #e2e8f0",
                        }}
                      />
                    </div>
                  )}
                  <div style={{ fontWeight: 600 }}>{card.titulo}</div>
                  {card.descricao && (
                    <div style={{ fontSize: "0.85rem", color: "#475569" }}>
                      {card.descricao}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "0.25rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: card.ativo ? "#16a34a" : "#94a3b8",
                        fontWeight: 500,
                      }}
                    >
                      {card.ativo ? "Ativo" : "Inativo"}
                    </span>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteCard(card.id)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
              Nenhum card criado ainda. Crie alguns para destacar seus principais produtos e serviços.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
