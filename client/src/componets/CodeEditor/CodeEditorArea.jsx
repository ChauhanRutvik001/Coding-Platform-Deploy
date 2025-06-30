import React, { useRef } from "react";
import Editor from "@monaco-editor/react";

const CodeEditorArea = ({
  language,
  code,
  handleEditorChange,
  title = "Code Editor",
  theme,
  handleThemeChange,
}) => {
  const editorRef = useRef(null);
  const internalCopyRef = useRef(false); // Track if copy happened inside

  const onMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.focus();

    editor.updateOptions({ contextmenu: false }); // disable right-click menu

    // Handle internal copy
    editor.onKeyDown((e) => {
      const { keyCode, ctrlKey, metaKey } = e;

      // Ctrl+C / Cmd+C for Copy
      if ((keyCode === monaco.KeyCode.KeyC) && (ctrlKey || metaKey)) {
        internalCopyRef.current = true;

        // Reset after 5 seconds
        setTimeout(() => {
          internalCopyRef.current = false;
        }, 5000);
      }

      // Ctrl+V / Cmd+V for Paste
      if ((keyCode === monaco.KeyCode.KeyV) && (ctrlKey || metaKey)) {
        if (!internalCopyRef.current) {
          e.preventDefault(); // block paste if not copied internally
        }
      }
    });

    // Fallback: disallow external paste via mouse/OS
    editor.onDidPaste(() => {
      if (!internalCopyRef.current) {
        const model = editor.getModel();
        const selection = editor.getSelection();

        if (model && selection) {
          model.pushEditOperations(
            [],
            [{ range: selection, text: "", forceMoveMarkers: true }],
            () => null
          );
        }
      }

      internalCopyRef.current = false; // always reset after paste
    });
  };

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden shadow-lg">
      <div className="flex justify-between items-center text-white p-3 border-b border-gray-600" style={{ backgroundColor: "#1e1e1e" }}>
        <div className="text-lg font-bold">{title}</div>
        <div className="relative inline-block">
          <select
            className="border border-gray-600 text-white rounded-md py-2 pl-3 pr-10 appearance-none outline-none cursor-pointer"
            style={{ backgroundColor: "#1e1e1e" }}
            onChange={(e) => handleThemeChange(e.target.value)}
            value={theme}
          >
            <option value="vs-dark">Dark</option>
            <option value="light">Light</option>
            <option value="hc-black">High Contrast</option>
          </select>
          <div className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 8L1 4H9L5 8Z" fill="#fff" />
            </svg>
          </div>
        </div>
      </div>
      <Editor
        height="400px"
        defaultLanguage={language}
        value={code}
        onChange={handleEditorChange}
        theme={theme}
        options={{
          fontSize: 14,
          automaticLayout: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          lineNumbers: "on",
          smoothScrolling: true,
          cursorSmoothCaretAnimation: true,
        }}
        onMount={onMount}
      />
    </div>
  );
};

export default CodeEditorArea;
