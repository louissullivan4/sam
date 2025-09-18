import { useEffect, useState, useMemo, type SetStateAction } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  Button,
  Tag,
  InlineNotification,
  Tile,
  StructuredListWrapper,
  StructuredListHead,
  StructuredListRow,
  StructuredListCell,
  StructuredListBody,
  SkeletonText,
  TextArea,
  OverflowMenu,
  OverflowMenuItem,
  TextInput,
  NumberInput,
  ComposedModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@carbon/react";
import type { Note, Request } from "../types";
import useUser from "../components/useUser";
import { formatDate, setTagType } from "../lib/comm";
import useIsSmallScreen from "../hooks/useIsSmallScreen";
import { List as ListIcon } from "@carbon/icons-react"; // optional icon for Actions FAB

export default function AssessmentDetail() {
  const { id } = useParams();
  const { userData } = useUser();
  const isSmall = useIsSmallScreen();

  const [req, setReq] = useState<(Request & { id: string }) | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<{
    name: string;
    email: string;
    skillLevelNumber: number;
    numberOfPeopleToBeAssessed: number;
  }>({
    name: "",
    email: "",
    skillLevelNumber: 1,
    numberOfPeopleToBeAssessed: 1,
  });

  // Mobile actions modal
  const [actionsOpen, setActionsOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const ref = doc(db, "requests", id).withConverter({
      toFirestore: (data: Request) => data,
      fromFirestore: (snap) => snap.data() as Request,
    });
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setReq(null);
          setLoading(false);
          return;
        }
        const data = { id: snap.id, ...(snap.data() as Request) };
        setReq(data);
        if (!editing) {
          setEditValues({
            name: data.name ?? "",
            email: data.email ?? "",
            skillLevelNumber: Number(data.skillLevelNumber ?? 1),
            numberOfPeopleToBeAssessed: Number(
              data.numberOfPeopleToBeAssessed ?? 1,
            ),
          });
        }
        setLoading(false);
      },
      (err: { message: SetStateAction<string | null> }) => {
        setActionError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [id, editing]);

  const canCancel = useMemo(
    () =>
      !!req &&
      ((req.status !== "Completed" &&
        req.status !== "Cancelled" &&
        req.accessorId === userData?.uid) ||
        userData?.role === "Admin"),
    [req, userData],
  );

  const canComplete = useMemo(
    () =>
      !!req &&
      ((req.status !== "Completed" && req.accessorId === userData?.uid) ||
        userData?.role === "Admin"),
    [req, userData],
  );

  const canInProgress = useMemo(
    () =>
      !!req &&
      ((req.status !== "In Progress" && req.accessorId === userData?.uid) ||
        userData?.role === "Admin"),
    [req, userData],
  );

  const canUnClaim = useMemo(
    () =>
      !!req &&
      !!userData &&
      req.status !== "New" &&
      req.status !== "Completed" &&
      req.status !== "Cancelled" &&
      (req.accessorId === userData.uid || userData?.role === "Admin"),
    [req, userData],
  );

  const canClaim = useMemo(
    () => !!req && !req.accessorId && req.status === "New",
    [req],
  );

  const canEdit = useMemo(
    () =>
      !!req && (req.accessorId === userData?.uid || userData?.role === "Admin"),
    [req, userData],
  );

  async function inProgressRequest() {
    if (!req) return;
    try {
      const newNote: Note = {
        authorId: userData?.name || "unknown",
        createdAt: new Date(),
        content: `Request marked as in progress by ${userData?.email || "unknown"}`,
      };
      await updateDoc(doc(db, "requests", req.id), {
        status: "In Progress",
        updatedAt: new Date(),
        notes: [...(req.notes || []), newNote],
      });
      setActionsOpen(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  }

  async function completeRequest() {
    if (!req) return;
    try {
      const newNote: Note = {
        authorId: userData?.name || "unknown",
        createdAt: new Date(),
        content: `Request marked as completed by ${userData?.email || "unknown"}`,
      };
      await updateDoc(doc(db, "requests", req.id), {
        status: "Completed",
        updatedAt: new Date(),
        notes: [...(req.notes || []), newNote],
      });
      setActionsOpen(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  }

  async function cancelRequest() {
    if (!req) return;
    try {
      const newNote: Note = {
        authorId: userData?.name || "unknown",
        createdAt: new Date(),
        content: `Request cancelled by ${userData?.email || "unknown"}`,
      };
      await updateDoc(doc(db, "requests", req.id), {
        status: "Cancelled",
        updatedAt: new Date(),
        notes: [...(req.notes || []), newNote],
      });
      setActionsOpen(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  }

  async function assignToMe() {
    if (!req || !userData) return;
    setActionError(null);
    try {
      const newNote: Note = {
        authorId: userData?.name || "unknown",
        createdAt: new Date(),
        content: `Request assigned to ${userData?.email || "unknown"}`,
      };
      await updateDoc(doc(db, "requests", req.id), {
        status: "Assigned",
        accessorId: userData.uid,
        accessorName: userData.name,
        accessorEmail: userData.email,
        updatedAt: new Date(),
        notes: [...(req.notes || []), newNote],
      });
      setActionsOpen(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  }

  async function unAssignFromMe() {
    if (!req || !userData) return;
    setActionError(null);
    try {
      const newNote: Note = {
        authorId: userData?.name || "unknown",
        createdAt: new Date(),
        content: `Request unassigned from ${userData?.email || "unknown"}`,
      };
      await updateDoc(doc(db, "requests", req.id), {
        status: "New",
        accessorId: "",
        accessorName: "",
        accessorEmail: "",
        updatedAt: new Date(),
        notes: [...(req.notes || []), newNote],
      });
      setActionsOpen(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleSaveEdit() {
    if (!req) return;
    setActionError(null);
    try {
      const newNote: Note = {
        authorId: userData?.name || "unknown",
        createdAt: new Date(),
        content: `Request edited by ${userData?.email || "unknown"}`,
      };
      await updateDoc(doc(db, "requests", req.id), {
        name: editValues.name.trim(),
        email: editValues.email.trim(),
        skillLevelNumber: Number(editValues.skillLevelNumber || 1),
        numberOfPeopleToBeAssessed: Number(
          editValues.numberOfPeopleToBeAssessed || 1,
        ),
        updatedAt: new Date(),
        notes: [...(req.notes || []), newNote],
      });
      setEditing(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleCancelEdit() {
    if (!req) {
      setEditing(false);
      return;
    }
    setEditValues({
      name: req.name ?? "",
      email: req.email ?? "",
      skillLevelNumber: Number(req.skillLevelNumber ?? 1),
      numberOfPeopleToBeAssessed: Number(req.numberOfPeopleToBeAssessed ?? 1),
    });
    setEditing(false);
  }

  async function updateNotes(n: Note | null) {
    if (!req) return;
    if (!n || n.content.trim() === "") return;
    setActionError(null);
    try {
      const ref = doc(db, "requests", req.id);
      await updateDoc(ref, {
        notes: [...(req.notes || []), n],
        updatedAt: new Date(),
      });
      setNote(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 900 }}>
        <SkeletonText heading width="30%" />
        <SkeletonText paragraph lineCount={3} />
      </div>
    );
  }

  if (!req) {
    return (
      <InlineNotification
        kind="error"
        lowContrast
        title="Not found"
        subtitle="This request doesn't exist or was removed."
      />
    );
  }

  // Action items shared by desktop kebab + mobile modal
  // Each button is full width so they all match.
  const ActionItems = (
    <div
      className="stack-gap"
      style={{
        display: "grid",
        gap: 8,
        gridTemplateColumns: "1fr",
      }}
    >
      {canClaim && (
        <Button kind="primary" onClick={assignToMe} style={{ width: "100%" }}>
          Assign To Me
        </Button>
      )}
      <Button
        kind="secondary"
        onClick={() => setEditing(true)}
        disabled={!canEdit || editing}
        style={{ width: "100%" }}
      >
        Edit
      </Button>
      <Button
        kind="secondary"
        onClick={inProgressRequest}
        disabled={!canInProgress}
        style={{ width: "100%" }}
      >
        In Progress
      </Button>
      <Button
        kind="secondary"
        onClick={completeRequest}
        disabled={!canComplete}
        style={{ width: "100%" }}
      >
        Complete
      </Button>
      {canUnClaim && (
        <Button
          kind="danger--tertiary"
          onClick={unAssignFromMe}
          style={{ width: "100%" }}
        >
          Unassign From Me
        </Button>
      )}
      <Button
        kind="danger"
        onClick={cancelRequest}
        disabled={!canCancel}
        style={{ width: "100%" }}
      >
        Cancel
      </Button>
    </div>
  );

  return (
    <div className="stack-gap" style={{ maxWidth: 1000, position: "relative" }}>
      {actionError && (
        <InlineNotification
          kind="error"
          lowContrast
          title="Action failed"
          subtitle={actionError}
          onCloseButtonClick={() => setActionError(null)}
        />
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <h3
          style={{
            margin: 0,
            flex: "1 1 auto",
            minWidth: 0,
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          Request Number: {req.id}
        </h3>

        {!isSmall && (
          <OverflowMenu size="lg">
            {canClaim && (
              <OverflowMenuItem itemText="Assign To Me" onClick={assignToMe} />
            )}
            <OverflowMenuItem
              itemText="Edit"
              onClick={() => setEditing(true)}
              disabled={!canEdit || editing}
            />
            <OverflowMenuItem
              itemText="In Progress"
              onClick={inProgressRequest}
              disabled={!canInProgress}
            />
            <OverflowMenuItem
              itemText="Complete"
              onClick={completeRequest}
              disabled={!canComplete}
            />
            {canUnClaim && (
              <OverflowMenuItem
                itemText="Unassign From Me"
                isDelete
                onClick={unAssignFromMe}
              />
            )}
            <OverflowMenuItem
              itemText="Cancel"
              isDelete
              onClick={cancelRequest}
              disabled={!canCancel}
            />
          </OverflowMenu>
        )}
      </div>

      <Tile>
        <StructuredListWrapper>
          <StructuredListHead>
            <StructuredListRow head>
              <StructuredListCell>Status</StructuredListCell>
              <Tag type={setTagType(req.status)}>{req.status}</Tag>
            </StructuredListRow>
          </StructuredListHead>
          <StructuredListBody>
            <StructuredListRow>
              <StructuredListCell>Requester</StructuredListCell>
              <StructuredListCell style={{ overflowWrap: "anywhere" }}>
                {editing ? (
                  <TextInput
                    id="edit-name"
                    labelText=""
                    hideLabel
                    value={editValues.name}
                    onChange={(e) =>
                      setEditValues((v) => ({ ...v, name: e.target.value }))
                    }
                  />
                ) : (
                  req.name
                )}
              </StructuredListCell>
            </StructuredListRow>

            <StructuredListRow>
              <StructuredListCell>Email</StructuredListCell>
              <StructuredListCell style={{ overflowWrap: "anywhere" }}>
                {editing ? (
                  <TextInput
                    id="edit-email"
                    type="email"
                    labelText=""
                    hideLabel
                    value={editValues.email}
                    onChange={(e) =>
                      setEditValues((v) => ({ ...v, email: e.target.value }))
                    }
                  />
                ) : (
                  req.email
                )}
              </StructuredListCell>
            </StructuredListRow>

            <StructuredListRow>
              <StructuredListCell>
                Assessment Skill Level Requested
              </StructuredListCell>
              <StructuredListCell>
                {editing ? (
                  <NumberInput
                    id="edit-skill"
                    label=""
                    hideLabel
                    min={1}
                    max={9}
                    step={1}
                    value={editValues.skillLevelNumber}
                    onChange={(_, { value }) =>
                      setEditValues((v) => ({
                        ...v,
                        skillLevelNumber: Number(value),
                      }))
                    }
                  />
                ) : (
                  req.skillLevelNumber || 1
                )}
              </StructuredListCell>
            </StructuredListRow>

            <StructuredListRow>
              <StructuredListCell>Number of People</StructuredListCell>
              <StructuredListCell>
                {editing ? (
                  <NumberInput
                    id="edit-people"
                    label=""
                    hideLabel
                    min={1}
                    step={1}
                    value={editValues.numberOfPeopleToBeAssessed}
                    onChange={(_, { value }) =>
                      setEditValues((v) => ({
                        ...v,
                        numberOfPeopleToBeAssessed: Number(value),
                      }))
                    }
                  />
                ) : (
                  req.numberOfPeopleToBeAssessed || 1
                )}
              </StructuredListCell>
            </StructuredListRow>

            {req.accessorName && !editing && (
              <StructuredListRow>
                <StructuredListCell>Accessor</StructuredListCell>
                <StructuredListCell style={{ overflowWrap: "anywhere" }}>
                  {req.accessorName}
                </StructuredListCell>
              </StructuredListRow>
            )}

            {req.createdAt && !editing && (
              <StructuredListRow>
                <StructuredListCell>Created</StructuredListCell>
                <StructuredListCell>
                  {formatDate(req.createdAt)}
                </StructuredListCell>
              </StructuredListRow>
            )}

            {req.updatedAt && !editing && (
              <StructuredListRow>
                <StructuredListCell>Last updated</StructuredListCell>
                <StructuredListCell>
                  {formatDate(req.updatedAt)}
                </StructuredListCell>
              </StructuredListRow>
            )}
          </StructuredListBody>
        </StructuredListWrapper>

        {editing && (
          <div
            style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}
          >
            <Button kind="primary" onClick={handleSaveEdit}>
              Save changes
            </Button>
            <Button kind="tertiary" onClick={handleCancelEdit}>
              Cancel
            </Button>
          </div>
        )}
      </Tile>

      <Tile>
        <div style={{ display: "grid", gap: 8 }}>
          <TextArea
            id="note"
            labelText="Add a note"
            placeholder="Leave a note for progress updates or communication."
            value={note?.content || ""}
            onChange={(e) =>
              setNote({
                authorId: userData?.name || "unknown",
                createdAt: new Date(),
                content: e.target.value,
              })
            }
          />
          <div>
            <Button size="sm" onClick={() => updateNotes(note)}>
              Save note
            </Button>
          </div>
        </div>

        <div
          className="stack-gap"
          style={{ marginTop: 16, display: "grid", gap: 12 }}
        >
          {(req.notes ?? []).length > 0 ? (
            [...(req.notes as Note[])].reverse().map((n, index) => (
              <Tile key={index} style={{ padding: 12 }}>
                <div
                  style={{
                    display: "grid",
                    gap: 8,
                    gridTemplateColumns: isSmall
                      ? "1fr"
                      : "minmax(160px, 240px) 1fr",
                    alignItems: "start",
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.85 }}>
                    <div style={{ fontWeight: 600 }}>
                      {formatDate(n.createdAt)}
                    </div>
                    <div style={{ marginTop: 2 }}>{n.authorId || "—"}</div>
                  </div>

                  <div
                    style={{
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                    }}
                  >
                    {n.content}
                  </div>
                </div>
              </Tile>
            ))
          ) : (
            <Tile>No notes available</Tile>
          )}
        </div>
      </Tile>

      {isSmall && (
        <>
          <Button
            kind="primary"
            size="lg"
            onClick={() => setActionsOpen(true)}
            renderIcon={ListIcon as any}
            style={{
              position: "fixed",
              right: 16,
              bottom: 16,
              zIndex: 1000,
              borderRadius: 999,
            }}
            iconDescription="Actions"
            hasIconOnly
          />

          <ComposedModal
            open={actionsOpen}
            onClose={() => setActionsOpen(false)}
          >
            <ModalHeader title="Actions" />
            <ModalBody>{ActionItems}</ModalBody>
            <ModalFooter>
              <Button kind="secondary" onClick={() => setActionsOpen(false)}>
                Close
              </Button>
            </ModalFooter>
          </ComposedModal>
        </>
      )}
    </div>
  );
}
