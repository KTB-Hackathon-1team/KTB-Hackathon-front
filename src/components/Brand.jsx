import { Link } from "react-router";

export function Brand({ to = "/" }) {
  return (
    <Link className="brand" to={to} aria-label="코코아 홈">
        <img className="brand__text" src="/text_logo.png" alt="텍스트 로고" aria-hidden="true" />
    </Link>
  );
}
