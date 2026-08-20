import { Coffee } from "lucide-react";
import { Link } from "react-router";

export function Brand({ to = "/" }) {
  return (
    <Link className="brand" to={to} aria-label="코코아 홈">
      <span className="brand__icon" aria-hidden="true"><Coffee /></span>
      <span>코코아</span>
    </Link>
  );
}
