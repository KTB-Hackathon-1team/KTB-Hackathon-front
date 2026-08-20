import { Brand } from "@/components/Brand";

export function AuthLayout({ children }) {
  return (
    <main className="auth-layout">
      <div className="auth-layout__brand"><Brand /></div>
      <div className="auth-layout__content">{children}</div>
      <footer className="auth-layout__footer">
        <span>개인정보처리방침</span>
        <span>이용약관</span>
        <span>© 코코아</span>
      </footer>
    </main>
  );
}
