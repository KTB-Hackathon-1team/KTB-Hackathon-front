import { useState } from "react";
import { ArrowLeft, ArrowRight, Brain, Heart, Lightbulb, LoaderCircle } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import useSWR from "swr";
import { counselingDetailKey, startCounselingSession } from "@/api/counselingApi";
import { Brand } from "@/components/Brand";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getErrorMessage } from "@/utils/errors";
import "./CounselingDetailPage.css";

const statusLabels = {
  DRAFT: "상담 준비",
  RECORDING: "대화 진행 중",
  TRANSCRIBING: "대화 정리 중",
  ANALYZING: "마음 분석 중",
  COMPLETED: "분석 완료",
  FAILED: "다시 시도 필요",
};

export function CounselingDetailPage() {
  const navigate = useNavigate();
  const { childId, sessionId } = useParams();
  const childProfileId = Number(childId);
  const counselingSessionId = Number(sessionId);
  const isValid =
    Number.isInteger(childProfileId) &&
    childProfileId > 0 &&
    Number.isInteger(counselingSessionId) &&
    counselingSessionId > 0;
  const detailKey = isValid ? counselingDetailKey(childProfileId, counselingSessionId) : null;
  const { data, error, isLoading } = useSWR(detailKey);
  const [isStarting, setIsStarting] = useState(false);
  const [actionError, setActionError] = useState("");
  const talkPath = `/children/${childProfileId}/counseling/${counselingSessionId}/talk`;

  async function handleStart() {
    setActionError("");
    setIsStarting(true);

    try {
      await startCounselingSession(childProfileId, counselingSessionId);
      navigate(talkPath);
    } catch (caught) {
      setActionError(getErrorMessage(caught));
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <main className="counseling-detail-page">
      <header className="counseling-detail-page__topbar">
        <Brand />
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/children/${childProfileId}/counseling`}><ArrowLeft /> 아이 공간</Link>
        </Button>
      </header>

      <section className="counseling-detail-page__content">
        {isLoading ? (
          <div className="counseling-detail-page__loading">
            <span><LoaderCircle className="spin" />상담 기록을 불러오는 중...</span>
          </div>
        ) : error || !data ? (
          <Alert variant="destructive">
            <AlertDescription>{error?.message ?? "상담 기록을 찾을 수 없습니다."}</AlertDescription>
          </Alert>
        ) : (
          <>
            <header className="counseling-detail-page__heading">
              <span className="status-badge">{statusLabels[data.status]}</span>
              <p>{data.date}</p>
              <h1>{data.title}</h1>
            </header>

            <Card className="counseling-detail-page__situation">
              <CardHeader><CardTitle>부모님이 남긴 상황</CardTitle></CardHeader>
              <CardContent><p>{data.content}</p></CardContent>
            </Card>

            {(data.status === "DRAFT" || data.status === "FAILED" || data.status === "RECORDING") && (
              <Card className="counseling-detail-page__action">
                <CardContent>
                  <div>
                    <strong>
                      {data.status === "RECORDING"
                        ? "아이와의 대화가 진행 중이에요"
                        : data.status === "FAILED"
                          ? "상담을 다시 시작할 수 있어요"
                          : "이제 아이와 대화를 시작해 보세요"}
                    </strong>
                    <p>
                      {data.status === "RECORDING"
                        ? "음성 화면으로 돌아가 대화를 이어갈 수 있어요."
                        : "음성 화면에서 코코아가 아이의 이야기를 차분히 이끌어 줄게요."}
                    </p>
                    {actionError && <span className="counseling-detail-page__action-error">{actionError}</span>}
                  </div>
                  <Button
                    onClick={data.status === "RECORDING" ? () => navigate(talkPath) : () => void handleStart()}
                    disabled={isStarting}
                  >
                    {isStarting
                      ? "상담 준비 중..."
                      : data.status === "RECORDING"
                        ? "대화로 돌아가기"
                        : data.status === "FAILED"
                          ? "다시 상담하기"
                          : "상담 자세히 보기"}
                    <ArrowRight />
                  </Button>
                </CardContent>
              </Card>
            )}

            {data.analysisReport ? (
              <section className="analysis-report" aria-labelledby="analysis-title">
                <h2 id="analysis-title">코코아의 마음 리포트</h2>
                <div className="analysis-report__grid">
                  <ReportCard icon={<Brain />} title="상황 요약" content={data.analysisReport.summary} />
                  <ReportCard icon={<Heart />} title="아이의 감정" content={data.analysisReport.emotionSummary} />
                  <ReportCard icon={<Lightbulb />} title="대화 방향" content={data.analysisReport.parentingGuidance} />
                </div>
              </section>
            ) : (
              <Card className="analysis-pending">
                <CardContent>
                  <span className="analysis-pending__icon"><Brain /></span>
                  <div>
                    <strong>마음 리포트가 아직 준비되지 않았어요</strong>
                    <p>아이와의 상담이 완료되면 상황 요약과 감정, 부모님을 위한 대화 방향이 이곳에 표시됩니다.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function ReportCard({ icon, title, content }) {
  return (
    <Card className="report-card">
      <CardContent>
        <span className="report-card__icon">{icon}</span>
        <h3>{title}</h3>
        <p>{content}</p>
      </CardContent>
    </Card>
  );
}
