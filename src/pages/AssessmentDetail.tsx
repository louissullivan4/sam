import { useEffect, useState, useMemo } from "react";
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
} from "@carbon/react";
import type { Note, Request } from "../types";
import useUser from "../components/useUser";
import { formatDate, setTagType } from "../lib/comm";

export default function AssessmentDetail() {
  const { id } = useParams();
  const { userData } = useUser();

  const [req, setReq] = useState<(Request & { id: string }) | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  // edit mode state
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

  useEffect(() => {
    if (!id) return;
    const ref = doc(db, "requests", id);
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
      (err) => {
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
      (!!req &&
      !!userData &&
      req.status !== "New" &&
      req.status !== "Completed" &&
      req.status !== "Cancelled") && (req.accessorId === userData.uid || userData?.role === "Admin"),
    [req, userData],
  );

  const canClaim = useMemo(
    () =>
      !!req &&
      !req.accessorId &&
      req.status === "New",
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
      const note = {
        authorId: userData?.name || "unknown",
        createdAt: new Date(),
        content: `Request marked as in progress by ${userData?.email || "unknown"}`,
      };
      await updateDoc(doc(db, "requests", req.id), {
        status: "In Progress",
        updatedAt: new Date(),
        notes: [...(req.notes || []), note],
      });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  } 

  async function completeRequest() {
    if (!req) return;
    try {
      const note = {
        authorId: userData?.name || "unknown",
        createdAt: new Date(),
        content: `Request marked as completed by ${userData?.email || "unknown"}`,
      };
      await updateDoc(doc(db, "requests", req.id), {
        status: "Completed",
        updatedAt: new Date(),
        notes: [...(req.notes || []), note],
      });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  }

  async function cancelRequest() {
    if (!req) return;
    try {
      const note = {
        authorId: userData?.name || "unknown",
        createdAt: new Date(),
        content: `Request cancelled by ${userData?.email || "unknown"}`,
      };
      await updateDoc(doc(db, "requests", req.id), {
        status: "Cancelled",
        updatedAt: new Date(),
        notes: [...(req.notes || []), note],
      });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  }

  async function assignToMe() {
    if (!req || !userData) return;
    setActionError(null);
    try {
      const note = {
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
        notes: [...(req.notes || []), note],
      });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  }

   async function unAssignFromMe() {
    if (!req || !userData) return;
    setActionError(null);
    try {
      const note = {
        authorId: userData?.name || "unknown",
        createdAt: new Date(),
        content: `Request unassigned from ${userData?.email || "unknown"}`,
      };
      await updateDoc(doc(db, "requests", req.id), {
        status: "New",
        accessorId: '',
        accessorName: '',
        accessorEmail: '',
        updatedAt: new Date(),
        notes: [...(req.notes || []), note],
      });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleSaveEdit() {
    if (!req) return;
    setActionError(null);
    try {
      const note = {
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
        notes: [...(req.notes || []), note],
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

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 1000 }}>
      {actionError && (
        <InlineNotification
          kind="error"
          lowContrast
          title="Action failed"
          subtitle={actionError}
          onCloseButtonClick={() => setActionError(null)}
        />
      )}

      {/* Header with kebab menu */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h3 style={{ margin: 0, flex: "0 0 auto" }}>
          Request Number: {req.id}
        </h3>
        <div style={{ flex: 1 }} />
        <OverflowMenu size="lg">
          {canClaim && (
            <OverflowMenuItem
              itemText="Assign To Me"
              onClick={assignToMe}
            />
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
            {/* Requester name */}
            <StructuredListRow>
              <StructuredListCell>Requester</StructuredListCell>
              <StructuredListCell>
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

            {/* Email */}
            <StructuredListRow>
              <StructuredListCell>Email</StructuredListCell>
              <StructuredListCell>
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

            {/* Skill level */}
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

            {/* Number of people */}
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
                <StructuredListCell>{req.accessorName}</StructuredListCell>
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

        {/* Edit controls */}
        {editing && (
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
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

        <StructuredListWrapper style={{ marginTop: 16 }}>
          <StructuredListHead>
            <StructuredListRow head>
              <StructuredListCell head>Author</StructuredListCell>
              <StructuredListCell head>Date</StructuredListCell>
              <StructuredListCell head>Note</StructuredListCell>
            </StructuredListRow>
          </StructuredListHead>
          <StructuredListBody>
            {(req.notes ?? []).length > 0 ? (
              [...(req.notes as Note[])].reverse().map((n, index) => (
                <StructuredListRow key={index}>
                  <StructuredListCell>{n.authorId}</StructuredListCell>
                  <StructuredListCell>
                    {formatDate(n.createdAt)}
                  </StructuredListCell>
                  <StructuredListCell>{n.content}</StructuredListCell>
                </StructuredListRow>
              ))
            ) : (
              <StructuredListRow>
                <StructuredListCell>No notes available</StructuredListCell>
              </StructuredListRow>
            )}
          </StructuredListBody>
        </StructuredListWrapper>
      </Tile>
    </div>
  );
}
