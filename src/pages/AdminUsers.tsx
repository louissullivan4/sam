import { useEffect, useMemo, useState, useCallback } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
  query,
  deleteDoc,
} from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { auth, db } from "../firebase";
import {
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Dropdown,
  Tag,
  InlineNotification,
  Layer,
  OverflowMenu,
  OverflowMenuItem,
  Modal,
  NumberInput,
  TextInput,
  SkeletonText,
  Button,
  Pagination,
  ComposedModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tile,
} from "@carbon/react";
import useUser from "../components/useUser";
import type { User } from "../types";
import { scoutCounties, countyToProvince } from "../refdata";
import { formatDate } from "../lib/comm";
import useIsSmallScreen from "../hooks/useIsSmallScreen";

const ROLE_OPTIONS: User["role"][] = [
  "Admin",
  "Accessor",
  "Inactive",
  "Rejected",
  "Pending",
];

const ROLE_COLOR: {
  [key in User["role"]]:
    | "red"
    | "magenta"
    | "purple"
    | "blue"
    | "cyan"
    | "teal"
    | "green"
    | "gray"
    | "cool-gray"
    | "warm-gray"
    | "high-contrast"
    | "outline"
    | undefined;
} = {
  Admin: "purple",
  Accessor: "green",
  Inactive: "gray",
  Rejected: "red",
  Pending: "teal",
};

function setRoleColor(role?: User["role"]) {
  if (!role) return "gray";
  return ROLE_COLOR[role] || "gray";
}

function roleIsAdmin(role?: string) {
  return role === "Admin";
}

type EditableUser = Partial<User> & { uid: string };

// Small-screen card for a single user row
function UserRowCard({
  user,
  onEdit,
  onDelete,
}: {
  user: User & { derivedProvince?: string };
  onEdit: (u: User) => void;
  onDelete: (u: User) => void;
}) {
  const derivedProvince = user.derivedProvince ?? "";
  return (
    <Tile className="stack-gap" style={{ padding: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "start",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, lineHeight: 1.2 }}>
            {user.name || "—"}
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, wordBreak: "break-all" }}>
            {user.email || "—"}
          </div>
        </div>
        <Tag type={setRoleColor(user.role)} size="sm">
          {user.role}
        </Tag>
      </div>

      <div style={{ display: "grid", gap: 6, gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Group</div>
          <div>{user.groupName || "—"}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Skill Level</div>
          <div>
            {typeof user.skillLevelNumber === "number"
              ? user.skillLevelNumber
              : "—"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Scout County</div>
          <div>
            {user.scoutCounty.replace("Scout County", "").trim() || "—"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Province</div>
          <div>
            {derivedProvince
              .replace("Province", "")
              .replace("Scout", "")
              .trim() || "—"}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button kind="tertiary" size="sm" onClick={() => onEdit(user)}>
          Edit
        </Button>
        <Button kind="danger--ghost" size="sm" onClick={() => onDelete(user)}>
          Delete
        </Button>
      </div>
    </Tile>
  );
}

export default function AdminUsers() {
  const [user] = useState(auth.currentUser);
  const { userData, userLoading } = useUser();
  const currentUserRole = userData?.role;
  const isAdmin = roleIsAdmin(currentUserRole);
  const isSmall = useIsSmallScreen();

  const [rows, setRows] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<EditableUser | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // Filters (mirror Assessments style)
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<User["role"] | "All">("All");
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [countyFilter, setCountyFilter] = useState<string | null>(null);
  const [provinceFilter, setProvinceFilter] = useState<string | null>(null);

  // Pagination (separate for Users / Incoming on small screens)
  const [pageUsers, setPageUsers] = useState(1);
  const [pageIncoming, setPageIncoming] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("name"));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({
          uid: d.id,
          ...(d.data() as any),
        })) as User[];
        setRows(list);
      },
      (e) => setError(e.message),
    );
  }, []);

  // Build filter options from data
  const { roleOptions, groupOptions, countyOptions, provinceOptions } =
    useMemo(() => {
      const roles = new Set<User["role"]>();
      const groups = new Set<string>();
      const counties = new Set<string>();
      const provinces = new Set<string>();
      rows.forEach((u) => {
        if (u.role) roles.add(u.role);
        if (u.groupName) groups.add(u.groupName);
        if (u.scoutCounty) counties.add(u.scoutCounty);
        const p = countyToProvince[u.scoutCounty as string] || u.province || "";
        if (p) provinces.add(p);
      });
      return {
        roleOptions: ["All", ...Array.from(roles).sort()] as Array<
          User["role"] | "All"
        >,
        groupOptions: Array.from(groups).sort(),
        countyOptions: Array.from(counties).sort(),
        provinceOptions: Array.from(provinces).sort(),
      };
    }, [rows]);

  const filtered = useMemo(() => {
    const t = search.toLowerCase().trim();
    let list = rows.map((u) => ({
      ...u,
      derivedProvince: u.scoutCounty
        ? countyToProvince[u.scoutCounty] || u.province || ""
        : u.province || "",
    }));

    if (t) {
      list = list.filter((u) =>
        [
          u.name,
          u.email,
          u.role,
          u.groupName,
          u.scoutCounty,
          (u as any).derivedProvince,
          String(u.skillLevelNumber ?? ""),
        ]
          .join(" ")
          .toLowerCase()
          .includes(t),
      );
    }

    if (roleFilter && roleFilter !== "All") {
      list = list.filter((u) => u.role === roleFilter);
    }
    if (groupFilter) {
      list = list.filter((u) => u.groupName === groupFilter);
    }
    if (countyFilter) {
      list = list.filter((u) => u.scoutCounty === countyFilter);
    }
    if (provinceFilter) {
      list = list.filter((u) => (u as any).derivedProvince === provinceFilter);
    }

    return list;
  }, [rows, search, roleFilter, groupFilter, countyFilter, provinceFilter]);

  const allUsers = useMemo(
    () => filtered.filter((u) => u.role !== "Pending"),
    [filtered],
  );
  const incoming = useMemo(
    () => filtered.filter((u) => u.role === "Pending"),
    [filtered],
  );

  // Reset pagination when filters/search change
  useEffect(() => {
    setPageUsers(1);
    setPageIncoming(1);
  }, [search, roleFilter, groupFilter, countyFilter, provinceFilter]);

  const pageSlice = (list: any[], page: number, size: number) => {
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  };

  const pagedUsers = useMemo(
    () => pageSlice(allUsers, pageUsers, pageSize),
    [allUsers, pageUsers, pageSize],
  );
  const pagedIncoming = useMemo(
    () => pageSlice(incoming, pageIncoming, pageSize),
    [incoming, pageIncoming, pageSize],
  );

  const updateUser = useCallback(async (uid: string, patch: Partial<User>) => {
    setError(null);
    setSavingId(uid);
    try {
      const updates: Partial<User> = {
        ...patch,
        updatedAt: new Date(),
      };
      if (patch.scoutCounty !== undefined) {
        updates.province = countyToProvince[patch.scoutCounty!] || "";
      }
      await updateDoc(doc(db, "users", uid), updates);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingId(null);
    }
  }, []);

  const handleOpenEdit = (u: User) => {
    setEditUser({
      uid: u.uid,
      name: u.name || "",
      email: u.email || "",
      groupName: u.groupName || "",
      scoutCounty: u.scoutCounty || "",
      province: countyToProvince[u.scoutCounty] || u.province || "",
      role: u.role,
      skillLevelNumber: Number(u.skillLevelNumber ?? 0),
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    const { uid, ...rest } = editUser;
    await updateUser(uid, rest as Partial<User>);
    setEditOpen(false);
    setEditUser(null);
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    setError(null);
    setSavingId(deleteUserId);
    try {
      await deleteDoc(doc(db, "users", deleteUserId));
      if (user) {
        await deleteUser(user);
      }
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : "Delete failed. Please try again later.",
      );
    } finally {
      setSavingId(null);
      setDeleteOpen(false);
      setDeleteUserId(null);
    }
  };

  const clearAllFilters = () => {
    setRoleFilter("All");
    setGroupFilter(null);
    setCountyFilter(null);
    setProvinceFilter(null);
  };

  if (userLoading) {
    return (
      <div style={{ maxWidth: 900 }}>
        <SkeletonText heading width="30%" />
        <SkeletonText paragraph lineCount={3} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <InlineNotification
        title="Insufficient permissions"
        kind="error"
        lowContrast
        subtitle="Only Admins can view the user dashboard."
      />
    );
  }

  const CommonToolbar = (
    <>
      <TableToolbar>
        <TableToolbarContent>
          <TableToolbarSearch
            persistent
            onChange={(e: any) => setSearch(e.target.value)}
          />
          <Button kind="ghost" onClick={() => setIsFilterOpen(true)}>
            Filters
          </Button>
          <Button
            kind="ghost"
            onClick={clearAllFilters}
            disabled={
              roleFilter === "All" &&
              !groupFilter &&
              !countyFilter &&
              !provinceFilter
            }
          >
            Clear
          </Button>
        </TableToolbarContent>
      </TableToolbar>
    </>
  );

  const renderActions = (u: User) => (
    <OverflowMenu aria-label="Actions" flipped>
      <OverflowMenuItem itemText="Edit" onClick={() => handleOpenEdit(u)} />
      <OverflowMenuItem
        isDelete
        hasDivider
        itemText="Delete"
        onClick={() => {
          setDeleteUserId(u.uid);
          setDeleteOpen(true);
        }}
      />
    </OverflowMenu>
  );

  const renderUsersTable = (
    list: (User & { derivedProvince?: string })[],
    title: string,
    columns: Array<{
      key: keyof User | "province" | "createdAt";
      header: string;
    }>,
  ) => (
    <DataTable
      rows={list.map((u) => ({ id: u.uid, ...u }))}
      headers={[...columns, { key: "actions" as const, header: "" }]}
    >
      {({ rows, headers, getHeaderProps, getTableProps }) => (
        <TableContainer title={title}>
          {CommonToolbar}
          <div className="table-scroll">
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map((h) => (
                    <TableHeader {...getHeaderProps({ header: h })}>
                      {h.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => {
                  const u = list.find((x) => x.uid === r.id);
                  if (!u) return null;
                  const derivedProvince =
                    u.derivedProvince ??
                    (countyToProvince[u.scoutCounty as string] ||
                      u.province ||
                      "");
                  return (
                    <TableRow key={u.uid} aria-busy={savingId === u.uid}>
                      {columns.map(({ key }) => {
                        switch (key) {
                          case "name":
                            return (
                              <TableCell key="name">{u.name || "—"}</TableCell>
                            );
                          case "email":
                            return (
                              <TableCell key="email">
                                {u.email || "—"}
                              </TableCell>
                            );
                          case "groupName":
                            return (
                              <TableCell key="groupName">
                                {u.groupName || "—"}
                              </TableCell>
                            );
                          case "scoutCounty":
                            return (
                              <TableCell key="scoutCounty">
                                {u.scoutCounty ? (
                                  <Tag size="sm">{u.scoutCounty}</Tag>
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                            );
                          case "province":
                            return (
                              <TableCell key="province">
                                {derivedProvince || "—"}
                              </TableCell>
                            );
                          case "skillLevelNumber":
                            return (
                              <TableCell key="skillLevelNumber">
                                {typeof u.skillLevelNumber === "number"
                                  ? u.skillLevelNumber
                                  : "—"}
                              </TableCell>
                            );
                          case "role":
                            return (
                              <TableCell key="role">
                                <Tag type={setRoleColor(u.role)} size="sm">
                                  {u.role}
                                </Tag>
                              </TableCell>
                            );
                          case "createdAt":
                            return (
                              <TableCell key="createdAt">
                                {formatDate(u.createdAt?.toString?.() ?? "") ||
                                  "—"}
                              </TableCell>
                            );
                          default:
                            return (
                              <TableCell key={String(key)}>
                                {(u as any)[key] ?? "—"}
                              </TableCell>
                            );
                        }
                      })}
                      <TableCell key="actions">{renderActions(u)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TableContainer>
      )}
    </DataTable>
  );

  return (
    <>
      {error && (
        <InlineNotification
          kind="error"
          lowContrast
          title="Operation failed"
          subtitle={error}
          onCloseButtonClick={() => setError(null)}
        />
      )}

      {isSmall ? (
        <div className="stack-gap">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <TableToolbarSearch
              persistent
              onChange={(e: any) => setSearch(e.target.value)}
            />
            <Button kind="ghost" onClick={() => setIsFilterOpen(true)}>
              Filters
            </Button>
            <Button
              kind="ghost"
              onClick={clearAllFilters}
              disabled={
                roleFilter === "All" &&
                !groupFilter &&
                !countyFilter &&
                !provinceFilter
              }
            >
              Clear
            </Button>
          </div>

          <h3 style={{ margin: 0 }}>Users</h3>
          <div className="stack-gap">
            {pagedUsers.map((u) => (
              <UserRowCard
                key={u.uid}
                user={u as User & { derivedProvince?: string }}
                onEdit={handleOpenEdit}
                onDelete={(user) => {
                  setDeleteUserId(user.uid);
                  setDeleteOpen(true);
                }}
              />
            ))}
          </div>
          <Pagination
            totalItems={allUsers.length}
            page={pageUsers}
            pageSize={pageSize}
            pageSizes={[10, 20, 50, 100]}
            onChange={({ page, pageSize }) => {
              setPageUsers(page);
              setPageSize(pageSize);
            }}
          />

          <h3 style={{ marginBottom: 0 }}>Incoming requests (Pending)</h3>
          <div className="stack-gap">
            {pagedIncoming.map((u) => (
              <UserRowCard
                key={u.uid}
                user={u as User & { derivedProvince?: string }}
                onEdit={handleOpenEdit}
                onDelete={(user) => {
                  setDeleteUserId(user.uid);
                  setDeleteOpen(true);
                }}
              />
            ))}
          </div>
          <Pagination
            totalItems={incoming.length}
            page={pageIncoming}
            pageSize={pageSize}
            pageSizes={[10, 20, 50, 100]}
            onChange={({ page, pageSize }) => {
              setPageIncoming(page);
              setPageSize(pageSize);
            }}
          />
        </div>
      ) : (
        <>
          {renderUsersTable(allUsers as any, "Users", [
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            { key: "groupName", header: "Group" },
            { key: "scoutCounty", header: "Scout County" },
            { key: "province", header: "Province" },
            { key: "skillLevelNumber", header: "Skill Level" },
            { key: "role", header: "Role" },
          ])}

          {isAdmin &&
            renderUsersTable(incoming as any, "Incoming requests (Pending)", [
              { key: "name", header: "Name" },
              { key: "email", header: "Email" },
              { key: "groupName", header: "Group" },
              { key: "scoutCounty", header: "Scout County" },
              { key: "province", header: "Province" },
              { key: "createdAt", header: "Requested" },
            ])}
        </>
      )}

      <Modal
        open={editOpen}
        modalHeading="Edit user"
        primaryButtonText="Save"
        secondaryButtonText="Cancel"
        onRequestClose={() => {
          setEditOpen(false);
          setEditUser(null);
        }}
        onRequestSubmit={handleSaveEdit}
      >
        {editUser && (
          <div style={{ display: "grid", gap: 12 }}>
            <TextInput
              id="edit-name"
              labelText="Full name"
              value={editUser.name || ""}
              onChange={(e: any) =>
                setEditUser((u) => ({ ...u!, name: e.target.value }))
              }
            />
            <TextInput
              id="edit-email"
              labelText="Email"
              type="email"
              value={editUser.email || ""}
              onChange={(e: any) =>
                setEditUser((u) => ({ ...u!, email: e.target.value }))
              }
            />
            <TextInput
              id="edit-group"
              labelText="Group"
              value={editUser.groupName || ""}
              onChange={(e: any) =>
                setEditUser((u) => ({ ...u!, groupName: e.target.value }))
              }
            />
            <Layer>
              <Dropdown
                id="edit-county"
                label="Scout County"
                titleText="Scout County"
                items={scoutCounties}
                selectedItem={editUser.scoutCounty || undefined}
                onChange={(e: any) =>
                  setEditUser((u) => ({
                    ...u!,
                    scoutCounty: e.selectedItem,
                    province: countyToProvince[e.selectedItem] || "",
                  }))
                }
                itemToString={(i: any) => i || ""}
              />
            </Layer>
            <TextInput
              id="edit-province"
              labelText="Province (auto)"
              value={editUser.province || ""}
              readOnly
            />
            <NumberInput
              id="edit-skill"
              label="Skill level"
              min={0}
              step={1}
              value={Number(editUser.skillLevelNumber ?? 1)}
              onChange={(
                _evt: unknown,
                { value }: { value: number | string },
              ) =>
                setEditUser((u) => ({
                  ...u!,
                  skillLevelNumber: Number(value || 1),
                }))
              }
            />
            <Layer>
              <Dropdown
                id="edit-role"
                label="Role"
                titleText="Role"
                items={ROLE_OPTIONS}
                selectedItem={editUser.role || "Pending"}
                onChange={(e: { selectedItem: User["role"] }) =>
                  setEditUser((u) => ({ ...u!, role: e.selectedItem }))
                }
                itemToString={(i: any) => i || ""}
              />
            </Layer>
          </div>
        )}
      </Modal>

      <Modal
        open={deleteOpen}
        modalHeading="Delete user?"
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        danger
        onRequestClose={() => {
          setDeleteOpen(false);
          setDeleteUserId(null);
        }}
        onRequestSubmit={handleDelete}
      >
        This action cannot be undone.
      </Modal>

      <ComposedModal
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        preventCloseOnClickOutside={false}
      >
        <ModalHeader title="Filters" />
        <ModalBody hasScrollingContent>
          <div className="cds--grid">
            <div className="cds--row">
              <div
                className="cds--col-sm-4 cds--col-md-4 cds--col-lg-4"
                style={{ marginBottom: "1em" }}
              >
                <Dropdown
                  id="filter-role"
                  titleText="Role"
                  label="Select role"
                  items={roleOptions as Array<User["role"] | "All">}
                  selectedItem={roleFilter}
                  itemToString={(i) => (typeof i === "string" ? i : "")}
                  onChange={(e) =>
                    setRoleFilter((e.selectedItem as any) || "All")
                  }
                />
              </div>
              <div
                className="cds--col-sm-4 cds--col-md-4 cds--col-lg-4"
                style={{ marginBottom: "1em" }}
              >
                <Dropdown
                  id="filter-group"
                  titleText="Group"
                  label="Select group"
                  items={groupOptions as string[]}
                  selectedItem={groupFilter}
                  itemToString={(i) => (typeof i === "string" ? i : "")}
                  onChange={(e) =>
                    setGroupFilter((e.selectedItem as string) || null)
                  }
                />
              </div>
              <div
                className="cds--col-sm-4 cds--col-md-4 cds--col-lg-4"
                style={{ marginBottom: "1em" }}
              >
                <Dropdown
                  id="filter-county"
                  titleText="Scout County"
                  label="Select county"
                  items={countyOptions as string[]}
                  selectedItem={countyFilter}
                  itemToString={(i) => (typeof i === "string" ? i : "")}
                  onChange={(e) =>
                    setCountyFilter((e.selectedItem as string) || null)
                  }
                />
              </div>
              <div className="cds--col-sm-4 cds--col-md-4 cds--col-lg-4">
                <Dropdown
                  id="filter-province"
                  titleText="Province"
                  label="Select province"
                  items={provinceOptions as string[]}
                  selectedItem={provinceFilter}
                  itemToString={(i) => (typeof i === "string" ? i : "")}
                  onChange={(e) =>
                    setProvinceFilter((e.selectedItem as string) || null)
                  }
                />
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button kind="secondary" onClick={clearAllFilters}>
            Clear all
          </Button>
          <Button kind="primary" onClick={() => setIsFilterOpen(false)}>
            Apply
          </Button>
        </ModalFooter>
      </ComposedModal>
    </>
  );
}
