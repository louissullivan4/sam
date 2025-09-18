import {
  Form,
  TextInput,
  TextArea,
  Button,
  ComboBox,
  NumberInput,
  InlineNotification,
  Tile,
} from "@carbon/react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import { scoutCounties, countyToProvince } from "../refdata";
import { useEffect, useState } from "react";
import type { Request, Note } from "../types";

export default function PublicForm() {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [group, setGroup] = useState("");
  const [scoutCounty, setScoutCounty] = useState<string>("");
  const [province, setProvince] = useState<string>(
    scoutCounty ? countyToProvince[scoutCounty] : "",
  );
  const [skillLevelNumber, setSkillLevelNumber] = useState<number>(1);
  const [numberOfPeopleToBeAssessed, setNumberOfPeopleToBeAssessed] =
    useState<number>(1);
  const [notes, setNotes] = useState<Omit<Note, "requestId" | "noteId">[]>([]);

  useEffect(() => {
    if (scoutCounty) {
      setProvince(countyToProvince[scoutCounty]);
    }
  }, [scoutCounty]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const doc: Omit<Request, "requestId"> = {
      name: name.trim(),
      email: email.trim(),
      groupName: group.trim(),
      scoutCounty: scoutCounty.trim(),
      province: province.trim(),
      skillLevelNumber,
      numberOfPeopleToBeAssessed,
      notes: notes as Note[],
      status: "New",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await addDoc(collection(db, "requests"), doc);
    setSent(true);

    setName("");
    setEmail("");
    setGroup("");
    setScoutCounty("");
    setSkillLevelNumber(1);
    setNumberOfPeopleToBeAssessed(1);
    setNotes([]);
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
        <h1 style={{ margin: 0, marginBottom: "1.25rem", fontSize: 24 }}>
          Request a Camping Skills Assessment
        </h1>

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
              label="What Camping skill level do you want assessed?"
              min={1}
              max={9}
              step={1}
              value={skillLevelNumber}
              onChange={(_, { value }) => setSkillLevelNumber(Number(value))}
              required
            />

            <NumberInput
              id="numberOfPeopleToBeAssessed"
              label="What are the number of people to be assessed?"
              min={1}
              step={1}
              value={numberOfPeopleToBeAssessed}
              onChange={(_, { value }) =>
                setNumberOfPeopleToBeAssessed(Number(value))
              }
              required
            />

            <TextArea
              id="notes"
              labelText="Notes (optional)"
              value={notes[0]?.content || ""}
              onChange={(e) =>
                setNotes([
                  {
                    authorId: email,
                    content: e.target.value,
                    createdAt: new Date(),
                  },
                ])
              }
            />

            <div style={{ marginTop: 8 }}>
              <Button kind="primary" type="submit">
                Submit request
              </Button>
            </div>
          </div>
        </Form>
      </Tile>
    </div>
  );
}
