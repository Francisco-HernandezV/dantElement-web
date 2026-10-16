import OfflineBanner from "./OfflineBanner";
import InstallPrompt from "./InstallPrompt";
import UpdateToast from "./UpdateToast";

// Capa PWA global: se monta una sola vez en main.jsx, fuera del Router.
export default function PwaUI() {
  return (
    <>
      <OfflineBanner />
      <div
        style={{
          position: "fixed",
          left: 16,
          right: 16,
          bottom: 16,
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxWidth: 420,
          pointerEvents: "none",
        }}
      >
        <UpdateToast />
        <InstallPrompt />
      </div>
    </>
  );
}
