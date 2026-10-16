import { VERDICT_LABEL } from "../lib/labels";

export default function VerdictBadge({ verdict }) {
  return <span className={`badge ${verdict}`}>{VERDICT_LABEL[verdict]}</span>;
}
