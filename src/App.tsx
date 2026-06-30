import { Header } from "./components/Header/Header";
import { Footer } from "./components/Footer/Footer";

/** Temporary shell — the game screen is wired up in a later phase. */
export function App() {
  return (
    <>
      <Header />
      <main
        style={{
          maxWidth: "var(--maxw)",
          margin: "0 auto",
          padding: "40px 20px",
          minHeight: "60vh",
        }}
      >
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem" }}>
          APEXLE
        </h1>
        <p style={{ color: "var(--bone-dim)", marginTop: 12 }}>
          Guess the Formula 1 corner from its telemetry. Scaffold in place.
        </p>
      </main>
      <Footer />
    </>
  );
}
