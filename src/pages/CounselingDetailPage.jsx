import { ArrowLeft, Brain, Heart, Lightbulb, LoaderCircle } from "lucide-react";
import { Link, useParams } from "react-router";
import useSWR from "swr";
import { counselingDetailKey } from "@/api/counselingApi";
import { Brand } from "@/components/Brand";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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
