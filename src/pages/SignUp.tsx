import {
  Form,
  TextInput,
  Button,
  ComboBox,
  NumberInput,
  InlineNotification,
  Tile,
  PasswordInput,
} from "@carbon/react";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { scoutCounties, countyToProvince } from "../refdata";
import React, { useEffect, useState } from "react";
import type { User } from "../types";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function PublicForm() {
  const nav = useNavigate();
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [group, setGroup] = useState("");
  const [scoutCounty, setScoutCounty] = useState<string>("");
  const [province, setProvince] = useState<string>(
    scoutCounty ? countyToProvince[scoutCounty] : "",
  );
  const [skillLevelNumber, setSkillLevelNumber] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (scoutCounty) {
      setProvince(countyToProvince[scoutCounty]);
    }
  }, [scoutCounty]);

  function validatePassword(password: string, confirmPassword: string): {isValid: boolean, errorMessage: string | null} {
    if (password !== confirmPassword) {
      return {isValid: false, errorMessage: "Passwords do not match."};
    }
    if (password.length < 6) {
      return {isValid: false, errorMessage: "Password should be at least 6 characters long."};
    }
    if (!/[A-Z]/.test(password)) {
      return {isValid: false, errorMessage: "Password should contain at least one uppercase letter."};
    }
    if (!/[a-z]/.test(password)) {
      return {isValid: false, errorMessage: "Password should contain at least one lowercase letter."};
    }
    if (!/[0-9]/.test(password)) {
      return {isValid: false, errorMessage: "Password should contain at least one number."};
    }
    if (!/[\W_]/.test(password)) {
      return {isValid: false, errorMessage: "Password should contain at least one special character."};
    }
    return {isValid: true, errorMessage: null}; 
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const { isValid, errorMessage } = validatePassword(password, confirmPassword);

    if (!isValid) {
      setError(errorMessage);
      return;
    }

    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      .catch((e) => {
        setError(e.message);
        return null;
      });

    if (!cred) return;

    const userData: Omit<User, "password"> = {
      uid: cred.user.uid,
      name: name.trim(),
      email: email.trim(),
      role: "Pending",
      groupName: group.trim(),
      scoutCounty: scoutCounty.trim(),
      province: province.trim(),
      skillLevelNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, "users", cred.user.uid), userData);
    setSent(true);

    nav("/pending");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f4f4",
        padding: "2rem",
      }}
    >
      <Tile
        style={{ width: "100%", maxWidth: 720, padding: "2rem 2rem 2.5rem" }}
      >
        <div style={{ margin: 0, marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: 24, marginBottom: "0.5rem" }}>
          Request a Camping Skills Assessment
        </h1>
        <h6>Already have an account? <Link to="/signin">Sign In</Link></h6>
        </div>

        {error && (
          <div style={{ margin: "1rem" }}>
            <InlineNotification
              title="Error"
              subtitle={error}
              onCloseButtonClick={() => setError(null)}
              kind="error"
              lowContrast
            />
          </div>
        )}

        {sent && (
          <div style={{ margin: "1rem" }}>
            <InlineNotification
              title="Submitted"
              subtitle="We'll be in touch soon."
              onCloseButtonClick={() => setSent(false)}
              kind="success"
              lowContrast
            />
          </div>
        )}

        <Form onSubmit={onSubmit}>
          <div style={{ display: "grid", gap: 16 }}>
            <TextInput
              id="name"
              name="name"
              labelText="Your name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <TextInput
              id="email"
              name="email"
              type="email"
              labelText="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <PasswordInput
              id="password"
              name="password"
              labelText="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hidePasswordLabel="Hide"
              showPasswordLabel="Show"
              required
            />
            

            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              labelText="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              hidePasswordLabel="Hide"
              showPasswordLabel="Show"
              required
            />


            <TextInput
              id="group"
              name="group"
              labelText="Scout group"
              required
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            />

            <ComboBox
              id="scoutCounty"
              name="scoutCounty"
              titleText="Scout County"
              placeholder="Select Scout County"
              items={scoutCounties}
              itemToString={(item) => (item ? String(item) : "")}
              selectedItem={scoutCounty ?? undefined}
              onChange={({ selectedItem }) =>
                setScoutCounty(selectedItem as string)
              }
              required
            />

            <TextInput
              id="province"
              labelText="Province"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
            />

            <NumberInput
              id="skillLevelNumber"
              label="What Camping skill level are you currently?"
              min={1}
              max={9}
              step={1}
              value={skillLevelNumber}
              onChange={(_, { value }) => setSkillLevelNumber(Number(value))}
              required
            />

            <div style={{ marginTop: 8 }}>
              <Button kind="primary" type="submit">
                Create Account
              </Button>
            </div>
          </div>
        </Form>
      </Tile>
    </div>
  );
}