import { Tile } from "@carbon/react";
import { Link } from "react-router-dom";

export default function Pending() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f4f4",
        padding: "1rem",
      }}
    >
      <Tile style={{ maxWidth: 520, width: "100%", padding: "2rem" }}>
        <h2 style={{ marginBottom: "1em" }}>
          Your account is pending approval
        </h2>
        <p>
          Thanks for signing up. An admin will review your request shortly.
          You'll get access once your role is updated.
        </p>
        <p style={{ marginTop: 16 }}>
          <Link to="/signin">Wanna try signing in?</Link>
        </p>
      </Tile>
    </div>
  );
}
