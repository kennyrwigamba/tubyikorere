import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ReportDocumentProps = {
  title: string;
  reportText: string;
  keyAchievements: string[];
  escalations: string[];
};

export function ReportDocument({
  title,
  reportText,
  keyAchievements,
  escalations,
}: ReportDocumentProps) {
  return (
    <Card className="print:rounded-none print:border-0 print:shadow-none">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="whitespace-pre-line text-sm leading-7">{reportText}</p>
        <section>
          <h4 className="mb-2 font-semibold">Key Achievements</h4>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {keyAchievements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h4 className="mb-2 font-semibold">Escalations</h4>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {escalations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </CardContent>
    </Card>
  );
}
