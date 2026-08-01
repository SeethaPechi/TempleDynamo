import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileText, Download } from "lucide-react";

export function OverviewDocTab() {
  const { data, isLoading, refetch } = useQuery<{ content: string }>({
    queryKey: ["/api/admin/overview-doc"],
  });

  const handleDownload = () => {
    if (!data?.content) return;
    const blob = new Blob([data.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "TAMIL_KOVIL_APP_OVERVIEW.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText size={16} /> App Overview Document
              </CardTitle>
              <CardDescription>
                Live view of <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">TAMIL_KOVIL_APP_OVERVIEW.md</code> — feed this to an LLM for improvement suggestions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => refetch()} title="Refresh">
                <RefreshCw size={13} />
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleDownload} disabled={!data?.content}>
                <Download size={13} className="mr-1" /> Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-saffron-500 mx-auto" />
            </div>
          ) : !data?.content ? (
            <div className="text-center py-16 text-gray-400 text-sm">Could not load overview document.</div>
          ) : (
            <div className="overflow-auto max-h-[72vh] pr-2">
              <div className="prose prose-sm prose-slate max-w-none
                prose-headings:text-temple-brown prose-headings:font-bold
                prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-1
                prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
                prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:text-xs
                prose-table:text-xs prose-table:w-full
                prose-th:bg-temple-light prose-th:text-temple-brown prose-th:font-semibold prose-th:px-2 prose-th:py-1
                prose-td:px-2 prose-td:py-1 prose-td:border prose-td:border-gray-200
                prose-a:text-saffron-600 prose-a:no-underline hover:prose-a:underline
                prose-blockquote:border-l-saffron-400 prose-blockquote:text-gray-500 prose-blockquote:italic
                prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1
              ">
                <ReactMarkdown>{data.content}</ReactMarkdown>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
