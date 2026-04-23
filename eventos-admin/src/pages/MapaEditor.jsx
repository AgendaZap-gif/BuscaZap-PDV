import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { getEvento, listExpositores, updateExpositor } from "../services/api";

export default function MapaEditor() {
  const { id } = useParams();
  const [evento, setEvento] = useState(null);
  const [expositores, setExpositores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imgSize, setImgSize] = useState(null); // { width, height } após imagem carregar — evita pin no lugar errado
  const imgRef = useRef(null);

  const load = () => {
    Promise.all([getEvento(id), listExpositores(id)])
      .then(([ev, list]) => {
        setEvento(ev);
        setExpositores(list);
      })
      .catch(() => {
        setEvento(null);
        setExpositores([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    setImgSize(null);
  }, [evento?.mapaUrl]);

  const handleMapClick = (e) => {
    if (!imgRef.current || !selected || !imgSize) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (mapaLargura / rect.width));
    const y = Math.round((e.clientY - rect.top) * (mapaAltura / rect.height));
    setSaving(true);
    const ex = expositores.find((e) => e.id === selected.id);
    updateExpositor(selected.id, {
      nome: ex?.nome ?? "",
      categoria: ex?.categoria ?? "",
      whatsapp: ex?.whatsapp ?? "",
      estande: ex?.estande ?? "",
      promocao: ex?.promocao ?? "",
      destaque: Boolean(ex?.destaque),
      patrocinado: Boolean(ex?.patrocinado),
      posX: x,
      posY: y,
    })
      .then(() => {
        load();
        setSelected(null);
      })
      .catch((err) => alert(err.response?.data?.error || "Erro ao salvar posição"))
      .finally(() => setSaving(false));
  };

  if (loading) return <div className="container">Carregando...</div>;
  if (!evento) return <div className="container">Evento não encontrado.</div>;

  const mapaLargura = evento.mapaLargura ?? 800;
  const mapaAltura = evento.mapaAltura ?? 600;

  if (!evento.mapaUrl) {
    return (
      <div className="container">
        <Link to={`/eventos/${id}/editar`} style={{ color: "#64748b" }}>← Evento</Link>
        <div className="card">
          <p>Configure a URL do mapa na <Link to={`/eventos/${id}/editar`}>edição do evento</Link>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: "1rem" }}>
        <Link to={`/eventos/${id}/expositores`} style={{ color: "#64748b", fontSize: "0.875rem" }}>← Expositores</Link>
        <h1 style={{ margin: "0.25rem 0" }}>Editor de mapa — {evento.nome}</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
          Clique em um expositor abaixo e depois clique no mapa para definir a posição do estande. A posição é salva automaticamente.
        </p>
      </div>

      <div className="card">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
          {expositores.map((ex) => (
            <button
              key={ex.id}
              type="button"
              className={`btn btn-sm ${selected?.id === ex.id ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setSelected(selected?.id === ex.id ? null : ex)}
            >
              {ex.nome} {ex.posX != null && ex.posY != null ? `(${ex.posX}, ${ex.posY})` : ""}
            </button>
          ))}
        </div>
        {selected && (
          <p style={{ marginBottom: "1rem", fontWeight: "600" }}>
            Posicionando: <strong>{selected.nome}</strong> — clique no mapa no local do estande.
          </p>
        )}
        {saving && <p style={{ color: "#64748b" }}>Salvando posição...</p>}
        <div
          style={{
            position: "relative",
            display: "inline-block",
            maxWidth: "100%",
            overflow: "auto",
            border: "2px solid #e2e8f0",
            borderRadius: "8px",
          }}
        >
          <img
            ref={imgRef}
            src={evento.mapaUrl}
            alt="Mapa da feira"
            style={{ display: "block", maxWidth: "100%", height: "auto", cursor: selected ? "crosshair" : "default" }}
            onClick={handleMapClick}
            onLoad={() => {
              if (imgRef.current) {
                const r = imgRef.current.getBoundingClientRect();
                setImgSize({ width: r.width, height: r.height });
              }
            }}
            draggable={false}
          />
          {imgSize &&
            expositores
              .filter((ex) => ex.posX != null && ex.posY != null)
              .map((ex) => {
                const scaleX = imgSize.width / mapaLargura;
                const scaleY = imgSize.height / mapaAltura;
                const isSelected = selected?.id === ex.id;
                const isDestaque = Boolean(ex.destaque);
                const isPatrocinado = Boolean(ex.patrocinado);
                let pinBg = "#16a34a";
                if (isSelected) pinBg = "#2563eb";
                else if (isPatrocinado) pinBg = "#7c3aed";
                else if (isDestaque) pinBg = "#ea580c";
                return (
                  <span
                    key={ex.id}
                    title={`${ex.nome}${isDestaque ? " · Destaque" : ""}${isPatrocinado ? " · Patrocinado" : ""}`}
                    style={{
                      position: "absolute",
                      left: (ex.posX || 0) * scaleX - 10,
                      top: (ex.posY || 0) * scaleY - 10,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: pinBg,
                      border: isDestaque || isPatrocinado ? "3px solid #fff" : "2px solid #fff",
                      boxShadow: isPatrocinado ? "0 0 0 2px #7c3aed" : "none",
                      pointerEvents: "none",
                      fontSize: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: "bold",
                    }}
                  >
                    •
                  </span>
                );
              })}
        </div>
      </div>
    </div>
  );
}
