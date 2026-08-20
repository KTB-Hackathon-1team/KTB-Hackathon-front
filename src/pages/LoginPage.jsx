import { useCallback, useState } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { ApiError } from "@/api/apiClient";
import { AuthLayout } from "@/components/AuthLayout";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useAuth } from "@/hooks/useAuth";
import "./LoginPage.css";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = useCallback(async ({ loginId, password }) => {
    setMessage("");
    try {
      await login(loginId, password);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "로그인 중 문제가 발생했습니다.");
    }
  }, [login, navigate]);

  return (
    <AuthLayout>
      <Card className="login-page__card auth-card">
        <CardHeader className="auth-card__header">
          <span className="auth-card__eyebrow">다시 만나서 반가워요</span>
          <CardTitle className="auth-card__title login-page__title">로그인</CardTitle>
          <CardDescription className="auth-card__description">
            코코아에서 아이와의 따뜻한 대화를 이어가세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="auth-form"
            onSubmit={handleSubmit(onSubmit, () => setMessage(""))}
            noValidate
          >
            <div className="form-field">
              <Label htmlFor="login-id">아이디</Label>
              <Input
                id="login-id"
                autoComplete="username"
                placeholder="아이디를 입력해 주세요"
                aria-invalid={Boolean(errors.loginId)}
                aria-describedby={errors.loginId ? "login-id-error" : undefined}
                className="auth-form__input"
                {...register("loginId", {
                  setValueAs: (value) => value.trim(),
                  required: "아이디를 입력해 주세요.",
                })}
              />
              {errors.loginId && (
                <p className="form-field__error" id="login-id-error">{errors.loginId.message}</p>
              )}
            </div>

            <div className="form-field">
              <Label htmlFor="login-password">비밀번호</Label>
              <div className="password-field">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력해 주세요"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "login-password-error" : undefined}
                  className="auth-form__input password-field__input"
                  {...register("password", {
                    required: "비밀번호는 8자 이상 입력해 주세요.",
                    minLength: { value: 8, message: "비밀번호는 8자 이상 입력해 주세요." },
                  })}
                />
                <Button
                  className="password-field__toggle"
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              {errors.password && (
                <p className="form-field__error" id="login-password-error">{errors.password.message}</p>
              )}
            </div>

            {message && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <Button className="auth-form__submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="auth-card__footer">
          계정이 없으신가요?
          <Button variant="link" asChild className="auth-card__footer-link">
            <Link to="/signup">회원가입</Link>
          </Button>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
