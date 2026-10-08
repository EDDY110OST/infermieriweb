import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Mark, mergeAttributes } from "@tiptap/core";

// Editor visuale degli articoli (TipTap). Caricato SOLO nel pannello admin, a richiesta.
// Produce HTML che il server passa comunque dalla lista bianca (src/lib/blog-html.js):
// qui c'è la comodità, lì la sicurezza. I colori sono una tavolozza chiusa (classi).

export const TONI = [
  { key: "navy", nome: "Blu", hex: "#0b3954" },
  { key: "verde", nome: "Verde", hex: "#00897b" },
  { key: "rosso", nome: "Rosso", hex: "#b91c1c" },
  { key: "ambra", nome: "Ambra", hex: "#b45309" },
  { key: "grigio", nome: "Grigio", hex: "#5c7280" },
];

// Colore come classe (col-navy…), mai come stile inline
const Colore = Mark.create({
  name: "colore",
  addAttributes() {
    return {
      tono: {
        default: null,
        parseHTML: (el) => (Array.from(el.classList).find((c) => c.startsWith("col-")) || "").slice(4) || null,
        renderHTML: (attrs) => (attrs.tono ? { class: `col-${attrs.tono}` } : {}),
      },
    };
  },
  parseHTML() { return [{ tag: "span[class*='col-']" }]; },
  renderHTML({ HTMLAttributes }) { return ["span", mergeAttributes(HTMLAttributes), 0]; },
  addCommands() {
    return {
      setColore: (tono) => ({ commands }) => commands.setMark(this.name, { tono }),
      unsetColore: () => ({ commands }) => commands.unsetMark(this.name),
    };
  },
});

// Tasto della barra (fuori dal componente: non va ricreato a ogni render)
function BottoneBarra({ attivo, onClick, title, children }) {
  return (
    <button type="button" className={`tt-btn${attivo ? " attivo" : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={onClick} title={title} aria-label={title} aria-pressed={!!attivo}>{children}</button>
  );
}

// onTesto (facoltativo): il testo nudo a ogni modifica, per contare i caratteri
// («Scrivi agli infermieri»). Il blog non lo usa.
export default function EditorArticolo({ html, onChange, onTesto }) {
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  const onTestoRef = useRef(onTesto);
  useEffect(() => { onTestoRef.current = onTesto; }, [onTesto]);
  const [linkAperto, setLinkAperto] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false, codeBlock: false, horizontalRule: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https", HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } },
      }),
      Colore,
    ],
    content: html || "",
    onCreate: ({ editor: ed }) => onTestoRef.current?.(ed.getText()),
    onUpdate: ({ editor: ed }) => { onChangeRef.current?.(ed.getHTML()); onTestoRef.current?.(ed.getText()); },
  });

  if (!editor) return <p className="pf-note">Carico l'editor…</p>;

  const apriLink = () => {
    setLinkUrl(editor.getAttributes("link").href || "");
    setLinkAperto(true);
  };
  const salvaLink = () => {
    const url = linkUrl.trim();
    if (!url) editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: /^(https?:|mailto:)/i.test(url) ? url : `https://${url}` }).run();
      // 8/10/26: il cursore va subito DOPO il link e si continua a scrivere fuori dal link.
      // Prima la parola restava selezionata: il primo tasto (o un Invio) cancellava il testo del link.
      const fine = editor.state.selection.to;
      editor.chain().setTextSelection(fine).unsetMark("link").run();
      setTimeout(() => { if (!editor.isDestroyed) editor.commands.focus(); }, 0);
    }
    setLinkAperto(false);
  };

  return (
    <div className="tt-editor">
      <div className="tt-barra" role="toolbar" aria-label="Formattazione">
        <BottoneBarra attivo={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Grassetto"><strong>G</strong></BottoneBarra>
        <BottoneBarra attivo={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Corsivo"><em>C</em></BottoneBarra>
        <BottoneBarra attivo={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Sottolineato"><u>S</u></BottoneBarra>
        <span className="tt-sep" />
        <BottoneBarra attivo={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Titolo di sezione">Titolo</BottoneBarra>
        <BottoneBarra attivo={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Sottotitolo">Sottotitolo</BottoneBarra>
        <BottoneBarra attivo={editor.isActive("paragraph") && !editor.isActive("bulletList") && !editor.isActive("orderedList")} onClick={() => editor.chain().focus().setParagraph().run()} title="Testo normale">Testo</BottoneBarra>
        <span className="tt-sep" />
        <BottoneBarra attivo={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Elenco puntato">• Elenco</BottoneBarra>
        <BottoneBarra attivo={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Elenco numerato">1. Elenco</BottoneBarra>
        <BottoneBarra attivo={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Nota in evidenza">❝ Nota</BottoneBarra>
        <span className="tt-sep" />
        <BottoneBarra attivo={editor.isActive("link")} onClick={apriLink} title="Link">🔗 Link</BottoneBarra>
        <span className="tt-sep" />
        <span className="tt-colori" title="Colore del testo">
          {TONI.map((t) => (
            <button type="button" key={t.key} onMouseDown={(e) => e.preventDefault()} className={`tt-colore${editor.isActive("colore", { tono: t.key }) ? " attivo" : ""}`} style={{ background: t.hex }} onClick={() => editor.chain().focus().setColore(t.key).run()} title={`Colore ${t.nome}`} aria-label={`Colore ${t.nome}`} />
          ))}
          <button type="button" onMouseDown={(e) => e.preventDefault()} className="tt-colore nessuno" onClick={() => editor.chain().focus().unsetColore().run()} title="Togli il colore" aria-label="Togli il colore">✕</button>
        </span>
        <span className="tt-sep" />
        <BottoneBarra onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Togli la formattazione">Pulisci</BottoneBarra>
      </div>
      {linkAperto && (
        <div className="tt-link pf-book">
          <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://… oppure mailto:…" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); salvaLink(); } }} autoFocus />
          <button type="button" className="pf-btn compatto" onClick={salvaLink}>{linkUrl.trim() ? "Metti il link" : "Togli il link"}</button>
          <button type="button" className="pf-btn secondario compatto" onClick={() => setLinkAperto(false)}>Annulla</button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
