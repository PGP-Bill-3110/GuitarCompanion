import { colors } from "../theme/colors";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

import {
    Document,
    Page,
    pdfjs,
} from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  file: string;
}

export default function PdfViewer({
  file,
}: PdfViewerProps) {
  const [numPages, setNumPages] =
    useState(0);

  const [pageNumber, setPageNumber] =
    useState(1);

  const [zoom, setZoom] =
    useState(1);

  const [windowWidth, setWindowWidth] =
    useState(1000);

  const [fullscreen, setFullscreen] =
    useState(false);

  // =========================================
  // RESPONSIVE
  // =========================================

  useEffect(() => {
    const updateSize = () => {
      setWindowWidth(window.innerWidth);
    };

    updateSize();

    window.addEventListener(
      "resize",
      updateSize
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateSize
      );
    };
  }, []);

  // Điện thoại sẽ gần full width,
  // desktop giới hạn khoảng 1000px.
  const availableWidth = Math.min(
    windowWidth - 24,
    1000
  );

  const pageWidth =
    Math.max(280, availableWidth) *
    zoom;

  // =========================================
  // DOCUMENT
  // =========================================

  function onDocumentLoadSuccess({
    numPages,
  }: {
    numPages: number;
  }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function previousPage() {
    setPageNumber((current) =>
      Math.max(1, current - 1)
    );
  }

  function nextPage() {
    setPageNumber((current) =>
      Math.min(
        numPages,
        current + 1
      )
    );
  }

  function zoomOut() {
    setZoom((current) =>
      Math.max(
        0.6,
        Number(
          (current - 0.15).toFixed(2)
        )
      )
    );
  }

  function zoomIn() {
    setZoom((current) =>
      Math.min(
        2.5,
        Number(
          (current + 0.15).toFixed(2)
        )
      )
    );
  }

  function resetZoom() {
    setZoom(1);
  }

  async function toggleFullscreen() {
    const viewer =
      document.getElementById(
        "guitar-pdf-viewer"
      );

    if (!viewer) {
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await viewer.requestFullscreen();

        setFullscreen(true);
      } else {
        await document.exitFullscreen();

        setFullscreen(false);
      }
    } catch (error) {
      console.error(
        "Fullscreen error:",
        error
      );
    }
  }

  // =========================================
  // UI
  // =========================================

  return (
    <div
      id="guitar-pdf-viewer"
      style={styles.container}
    >
      {/* TOOLBAR */}

      <div style={styles.toolbar}>
        <div style={styles.group}>
          <button
            style={{
              ...styles.button,
              opacity:
                pageNumber <= 1
                  ? 0.4
                  : 1,
            }}
            onClick={previousPage}
            disabled={pageNumber <= 1}
          >
            ‹
          </button>

          <span style={styles.page}>
            {pageNumber} /{" "}
            {numPages || "--"}
          </span>

          <button
            style={{
              ...styles.button,
              opacity:
                pageNumber >= numPages
                  ? 0.4
                  : 1,
            }}
            onClick={nextPage}
            disabled={
              pageNumber >= numPages
            }
          >
            ›
          </button>
        </div>

        <div style={styles.separator} />

        {/* ZOOM */}

        <div style={styles.group}>
          <button
            style={styles.button}
            onClick={zoomOut}
          >
            −
          </button>

          <span style={styles.zoom}>
            {Math.round(zoom * 100)}%
          </span>

          <button
            style={styles.button}
            onClick={zoomIn}
          >
            +
          </button>
        </div>

        <button
          style={styles.primaryButton}
          onClick={resetZoom}
        >
          Fit
        </button>

        <button
          style={styles.fullscreenButton}
          onClick={toggleFullscreen}
        >
          {fullscreen
            ? "Thoát toàn màn hình"
            : "Toàn màn hình"}
        </button>
      </div>

      {/* PDF */}

      <div style={styles.viewer}>
  <Document
    file={file}
    suspense={false}
    onLoadSuccess={({ numPages }) => {
      console.log(
        "PDF loaded successfully:",
        numPages,
        "pages"
      );

      setNumPages(numPages);
      setPageNumber(1);
    }}
    onLoadError={(error) => {
      console.error(
        "PDF LOAD ERROR:",
        error
      );
    }}
    onSourceError={(error) => {
      console.error(
        "PDF SOURCE ERROR:",
        error
      );
    }}
    loading={
      <div style={styles.loading}>
        <div style={styles.loadingIcon}>
          ♪
        </div>

        <div>Đang tải score...</div>
      </div>
    }
    error={
      <div style={styles.error}>
        Không thể tải PDF.
        <br />
        <strong>{file}</strong>
      </div>
    }
  >
    <div style={styles.pageContainer}>
      <Page
        pageNumber={pageNumber}
        width={pageWidth}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        loading={
          <div style={styles.loading}>
            Đang tải trang...
          </div>
        }
      />
    </div>
  </Document>
</div>
</div>
  );
}

const styles: Record<
  string,
  CSSProperties
> = {
  container: {
    width: "100%",
    height: "100%",

    display: "flex",
    flexDirection: "column",

    backgroundColor: colors.surfaceRaised,
  },

  toolbar: {
    minHeight: 58,

    padding: "8px 12px",

    display: "flex",
    alignItems: "center",

    gap: 10,

    backgroundColor: colors.surface,

    borderBottom:
      "1px solid #303038",

    overflowX: "auto",

    flexShrink: 0,
  },

  group: {
    display: "flex",

    alignItems: "center",

    gap: 7,

    flexShrink: 0,
  },

  separator: {
    width: 1,
    height: 28,

    backgroundColor: colors.surfaceMuted,

    flexShrink: 0,
  },

  button: {
    width: 38,
    height: 38,

    border: "none",

    borderRadius: 10,

    backgroundColor: colors.surfaceMuted,

    color: "#FFFFFF",

    fontSize: 23,

    cursor: "pointer",
  },

  primaryButton: {
    height: 38,

    padding: "0 14px",

    border: "none",

    borderRadius: 10,

    backgroundColor: colors.action,

    color: "#FFFFFF",

    cursor: "pointer",

    fontWeight: 600,

    flexShrink: 0,
  },

  fullscreenButton: {
    height: 38,

    padding: "0 14px",

    border: "1px solid #383840",

    borderRadius: 10,

    backgroundColor: colors.surfaceRaised,

    color: colors.textSoft,

    cursor: "pointer",

    flexShrink: 0,
  },

  page: {
    minWidth: 50,

    color: "#FFFFFF",

    textAlign: "center",

    fontSize: 14,
  },

  zoom: {
    minWidth: 47,

    color: colors.textSoft,

    textAlign: "center",

    fontSize: 13,
  },

  viewer: {
    flex: 1,

    overflow: "auto",

    WebkitOverflowScrolling:
      "touch",

    backgroundColor: colors.surfaceRaised,

    padding: "16px 0",
  },

  pageContainer: {
    display: "flex",

    justifyContent: "center",

    width: "max-content",

    minWidth: "100%",

    margin: "0 auto",
  },

  loading: {
    minHeight: 300,

    display: "flex",

    flexDirection: "column",

    justifyContent: "center",
    alignItems: "center",

    gap: 10,

    color: colors.textSoft,
  },

  loadingIcon: {
    color: colors.accent,

    fontSize: 35,
  },

  error: {
    padding: 50,

    color: "#F87171",

    textAlign: "center",

    lineHeight: 1.8,
  },
};