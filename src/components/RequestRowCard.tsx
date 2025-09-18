import { Tag, Tile } from "@carbon/react";
import { type Request } from "../types";
import { setTagType, formatDate } from "../lib/comm";

type Props = {
  data: Request;
  onClick?: () => void;
};

export default function RequestRowCard({ data, onClick }: Props) {
  return (
    <Tile
      onClick={onClick}
      style={{
        cursor: "pointer",
        padding: "1rem",
        display: "grid",
        gap: 6,
      }}
      aria-label={`Open request ${data.requestId ?? ""}`}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <strong style={{ fontSize: 16, lineHeight: 1.2 }}>
          {data.name ?? "—"}
        </strong>
        <Tag type={setTagType(data.status)}>{data.status ?? ""}</Tag>
      </div>
      <div style={{ color: "#525252" }}>{data.email ?? ""}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {data.groupName && <Tag type="gray">{data.groupName}</Tag>}
        {data.scoutCounty && (
          <Tag type="cool-gray">
            {data.scoutCounty.replace("Scout County", "")}
          </Tag>
        )}
        {data.province && <Tag type="warm-gray">{data.province}</Tag>}
        <Tag type="teal">Lvl {String(data.skillLevelNumber ?? 1)}</Tag>
        <Tag type="cyan">
          {String(data.numberOfPeopleToBeAssessed ?? 1)} ppl
        </Tag>
      </div>
      <div style={{ color: "#8d8d8d", fontSize: 12 }}>
        {data.updatedAt
          ? `Updated: ${formatDate(data.updatedAt, true)}`
          : data.createdAt
            ? `Created: ${formatDate(data.createdAt, true)}`
            : ""}
      </div>
    </Tile>
  );
}
