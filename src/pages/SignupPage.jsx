import { useCallback, useState } from "react";
import { AlertCircle, Eye, EyeOff, Info } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/Checkbox";
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
    control,
    getValues,
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { terms: false } });

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
          <CardDescription className="auth-card__description">
            아이 프로필은 가입 후 연결할 수 있어요.
          </CardDescription>
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
                placeholder="사용할 아이디를 입력해 주세요"
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
                placeholder="부모님을 부를 이름"
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
                  placeholder="영문·숫자 포함 8자 이상"
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
                placeholder="비밀번호를 한 번 더 입력해 주세요"
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

            <Alert className="signup-form__info">
              <Info />
              <AlertDescription>
                <strong>아이 프로필은 나중에 연결할 수 있어요</strong>
                <span>가입 단계에서는 아이의 개인정보를 받지 않아요.</span>
              </AlertDescription>
            </Alert>

            <div className="terms-field">
              <Controller
                name="terms"
                control={control}
                rules={{ validate: (value) => value || "필수 약관에 동의해 주세요." }}
                render={({ field }) => (
                  <Checkbox
                    id="terms"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    aria-invalid={Boolean(errors.terms)}
                  />
                )}
              />
              <div>
                <Label htmlFor="terms" className="terms-field__label">
                  <strong>필수</strong>이용약관 및 개인정보처리방침에 동의합니다.
                </Label>
                {errors.terms && <p className="form-field__error terms-field__error">{errors.terms.message}</p>}
              </div>
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
