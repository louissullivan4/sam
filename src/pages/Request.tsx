import {
  DataTable,
  Tag,
  TableToolbar,
  TableToolbarSearch,
  TableToolbarContent,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Pagination,
  Button,
  ComposedModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Dropdown,
  SkeletonText,
} from "@carbon/react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type Request } from "../types";
import { formatDate, setTagType } from "../lib/comm";
import useUser from "../components/useUser";
import useIsSmallScreen from "../hooks/useIsSmallScreen";
import RequestRowCard from "../components/RequestRowCard";

export default function Requests() {
  const { userLoading } = useUser();
  const nav = useNavigate();
  const isSmall = useIsSmallScreen();
  const [rows, setRows] = useState<Request[]>([]);
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [countyFilter, setCountyFilter] = useState<string | null>(null);
  const [provinceFilter, setProvinceFilter] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    const allRequests = query(
      collection(db, "requests"),
      orderBy("createdAt", "desc"),
    );
    return onSnapshot(
      allRequests,
      (snap: { docs: { id: unknown; data: () => unknown }[] }) => {
        setRows(
          snap.docs.map(
            (doc: { id: unknown; data: () => unknown }) =>
              ({
                requestId: doc.id,
                ...(doc.data() as Record<string, unknown>),
              }) as Request,
          ),
        );
      },
    );
  }, []);

  const { statusOptions, groupOptions, countyOptions, provinceOptions } =
    useMemo(() => {
      const statuses = new Set<string>();
      const groups = new Set<string>();
      const counties = new Set<string>();
      const provinces = new Set<string>();
      rows.forEach((r) => {
        if (r?.status) statuses.add(r.status);
        if (r?.groupName) groups.add(r.groupName);
        if (r?.scoutCounty)
          counties.add(r.scoutCounty.replace("Scout County", "").trim());
        if (r?.province) provinces.add(r.province);
      });
      return {
        statusOptions: ["All", ...Array.from(statuses).sort()],
        groupOptions: Array.from(groups).sort(),
        countyOptions: Array.from(counties).sort(),
        provinceOptions: Array.from(provinces).sort(),
      };
    }, [rows]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    let out = rows.filter((r) => {
      const haystack = [r?.email, r?.groupName, r?.scoutCounty, r?.province]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });

    if (statusFilter && statusFilter !== "All") {
      out = out.filter((r) => r.status === statusFilter);
    }
    if (groupFilter) {
      out = out.filter((r) => r.groupName === groupFilter);
    }
    if (countyFilter) {
      out = out.filter(
        (r) =>
          r.scoutCounty?.replace("Scout County", "").trim() === countyFilter,
      );
    }
    if (provinceFilter) {
      out = out.filter((r) => r.province === provinceFilter);
    }

    return out;
  }, [rows, search, statusFilter, groupFilter, countyFilter, provinceFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, groupFilter, countyFilter, provinceFilter]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, page, pageSize]);

  const tableRows = useMemo(
    () => paged.map((row) => ({ ...row, id: row.requestId })),
    [paged],
  );

  const dataById = useMemo(() => {
    const m = new Map<string, Request>();
    paged.forEach((x) => m.set(x.requestId, x));
    return m;
  }, [paged]);

  const clearAllFilters = () => {
    setStatusFilter("All");
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

  return (
    <>
      {isSmall ? (
        <>
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
                  statusFilter === "All" &&
                  !groupFilter &&
                  !countyFilter &&
                  !provinceFilter
                }
              >
                Clear
              </Button>
            </div>

            {paged.map((data) => (
              <RequestRowCard
                key={data.requestId}
                data={data}
                onClick={() => nav(`/requests/${data.requestId}`)}
              />
            ))}

            <div>
              <Pagination
                totalItems={filtered.length}
                page={page}
                pageSize={pageSize}
                pageSizes={[5, 10, 20, 50, 100]}
                onChange={({ page, pageSize }) => {
                  setPage(page);
                  setPageSize(pageSize);
                }}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <DataTable
            rows={tableRows}
            headers={[
              { key: "name", header: "Name" },
              { key: "groupName", header: "Group" },
              { key: "scoutCounty", header: "County" },
              { key: "province", header: "Province" },
              { key: "skillLevelNumber", header: "Requested Skill Level" },
              { key: "numberOfPeopleToBeAssessed", header: "No. of People" },
              { key: "status", header: "Status" },
              { key: "createdAt", header: "Created" },
              { key: "updatedAt", header: "Last Updated" },
            ]}
          >
            {({ rows, headers, getHeaderProps, getTableProps }) => (
              <TableContainer title="Open Requests">
                <TableToolbar>
                  <TableToolbarContent>
                    <TableToolbarSearch
                      persistent
                      onChange={(e: any) => setSearch(e.target.value)}
                    />
                    <div className="cds--toolbar-item">
                      <Button
                        kind="ghost"
                        onClick={() => setIsFilterOpen(true)}
                      >
                        Filters
                      </Button>
                    </div>
                    <div className="cds--toolbar-item">
                      <Button
                        kind="ghost"
                        onClick={clearAllFilters}
                        disabled={
                          statusFilter === "All" &&
                          !groupFilter &&
                          !countyFilter &&
                          !provinceFilter
                        }
                      >
                        Clear
                      </Button>
                    </div>
                  </TableToolbarContent>
                </TableToolbar>

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
                      const data = dataById.get(r.id);
                      if (!data) return null;
                      return (
                        <TableRow
                          key={r.id}
                          onClick={() => nav(`/requests/${r.id}`)}
                          style={{ cursor: "pointer" }}
                        >
                          <TableCell>{data.name ?? ""}</TableCell>
                          <TableCell>{data.groupName ?? ""}</TableCell>
                          <TableCell>
                            {data.scoutCounty
                              ? data.scoutCounty.replace("Scout County", "")
                              : ""}
                          </TableCell>
                          <TableCell>
                            <Tag type="gray">{data.province ?? ""}</Tag>
                          </TableCell>
                          <TableCell>
                            {String(data.skillLevelNumber ?? 1)}
                          </TableCell>
                          <TableCell>
                            {String(data.numberOfPeopleToBeAssessed ?? 1)}
                          </TableCell>
                          <TableCell>
                            <Tag type={setTagType(data.status)}>
                              {data.status ?? ""}
                            </Tag>
                          </TableCell>
                          <TableCell>
                            {data.createdAt
                              ? formatDate(data.createdAt, true)
                              : ""}
                          </TableCell>
                          <TableCell>
                            {data.updatedAt
                              ? formatDate(data.updatedAt, true)
                              : ""}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <div style={{ paddingBlock: "0.5rem" }}>
                  <Pagination
                    totalItems={filtered.length}
                    page={page}
                    pageSize={pageSize}
                    pageSizes={[10, 20, 50, 100]}
                    onChange={({ page, pageSize }) => {
                      setPage(page);
                      setPageSize(pageSize);
                    }}
                  />
                </div>
              </TableContainer>
            )}
          </DataTable>

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
                      id="filter-status"
                      titleText="Status"
                      label="Select status"
                      items={statusOptions as string[]}
                      selectedItem={statusFilter}
                      itemToString={(i) => (typeof i === "string" ? i : "")}
                      onChange={(e) =>
                        setStatusFilter((e.selectedItem as string) || "All")
                      }
                      helperText="Filter by exact status"
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
                      helperText="Filter by exact group"
                    />
                  </div>
                  <div
                    className="cds--col-sm-4 cds--col-md-4 cds--col-lg-4"
                    style={{ marginBottom: "1em" }}
                  >
                    <Dropdown
                      id="filter-county"
                      titleText="County"
                      label="Select county"
                      items={countyOptions as string[]}
                      selectedItem={countyFilter}
                      itemToString={(i) => (typeof i === "string" ? i : "")}
                      onChange={(e) =>
                        setCountyFilter((e.selectedItem as string) || null)
                      }
                      helperText="County (without 'Scout County')"
                    />
                  </div>
                  <div
                    className="cds--col-sm-4 cds--col-md-4 cds--col-lg-4"
                    style={{ marginBottom: "1em" }}
                  >
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
                      helperText="Filter by province"
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
      )}
    </>
  );
}
