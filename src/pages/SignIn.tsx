import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  Form,
  TextInput,
  Button,
  InlineNotification,
  Tile,
} from "@carbon/react";
import { Link } from "react-router-dom";

export default function SignIn() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/requests";

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const data = new FormData(e.currentTarget);
    const email = data.get("email") as string;
    const password = data.get("password") as string;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

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
      <Tile style={{ maxWidth: 400, width: "100%", padding: "2rem" }}>
        <h2 style={{ marginBottom: "2rem" }}>Sign in to SAM</h2>
        {error && (
          <InlineNotification
            kind="error"
            lowContrast
            title="Error"
            subtitle={error}
            onCloseButtonClick={() => setError(null)}
          />
        )}
        <Form onSubmit={handleSubmit}>
          <TextInput
            id="email"
            name="email"
            type="email"
            labelText="Email"
            required
            style={{ marginBottom: "1rem" }}
          />
          <TextInput
            id="password"
            name="password"
            type="password"
            labelText="Password"
            required
            style={{ marginBottom: "1rem" }}
          />
          <Button
            kind="primary"
            type="submit"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </Form>
        <p style={{ marginTop: 16, textAlign: "center" }}>
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </Tile>
    </div>
  );
}
