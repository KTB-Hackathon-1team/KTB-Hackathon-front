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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useAuth } from "@/hooks/useAuth";
import "./SignupPage.css";

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const {
    getValues,
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm({ mode: "onBlur" });

  const onSubmit = useCallback(async ({ loginId, nickname, password }) => {
    setMessage("");
    try {
      await signup(loginId, password, nickname);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "회원가입 중 문제가 발생했습니다.");
    }
  }, [navigate, signup]);

  return (
    <AuthLayout>
      <Card className="signup-page__card auth-card">
        <CardHeader className="auth-card__header signup-page__header">
          <span className="auth-card__eyebrow">부모 계정</span>
          <CardTitle className="auth-card__title signup-page__title">회원가입</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="signup-form"
            onSubmit={handleSubmit(onSubmit, () => setMessage(""))}
            noValidate
          >
            <div className="form-field form-field--compact">
              <Label htmlFor="signup-id">아이디</Label>
              <Input
                id="signup-id"
                autoComplete="username"
                aria-invalid={Boolean(errors.loginId)}
                className="signup-form__input"
                {...register("loginId", {
                  setValueAs: (value) => value.trim(),
                  required: "아이디를 입력해 주세요.",
                })}
              />
              {errors.loginId && <p className="form-field__error">{errors.loginId.message}</p>}
            </div>

            <div className="form-field form-field--compact">
              <Label htmlFor="signup-nickname">닉네임</Label>
              <Input
                id="signup-nickname"
                autoComplete="nickname"
                aria-invalid={Boolean(errors.nickname)}
                className="signup-form__input"
                {...register("nickname", {
                  setValueAs: (value) => value.trim(),
                  required: "닉네임을 입력해 주세요.",
                })}
              />
              {errors.nickname && <p className="form-field__error">{errors.nickname.message}</p>}
            </div>

            <div className="form-field form-field--compact">
              <Label htmlFor="signup-password">비밀번호</Label>
              <div className="password-field">
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                  className="signup-form__input password-field__input"
                  {...register("password", {
                    required: "영문·숫자를 포함해 8자 이상 입력해 주세요.",
                    minLength: {
                      value: 8,
                      message: "영문·숫자를 포함해 8자 이상 입력해 주세요.",
                    },
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
              {errors.password && <p className="form-field__error">{errors.password.message}</p>}
            </div>

            <div className="form-field form-field--compact">
              <Label htmlFor="signup-confirm">비밀번호 확인</Label>
              <Input
                id="signup-confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword)}
                className="signup-form__input"
                {...register("confirmPassword", {
                  validate: (value) => value === getValues("password") || "비밀번호가 일치하지 않아요.",
                })}
              />
              {errors.confirmPassword && (
                <p className="form-field__error">{errors.confirmPassword.message}</p>
              )}
            </div>

            {message && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <Button className="signup-form__submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "계정 만드는 중..." : "계정 만들기"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="auth-card__footer">
          이미 계정이 있으신가요?
          <Button variant="link" asChild className="auth-card__footer-link">
            <Link to="/login">로그인</Link>
          </Button>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
