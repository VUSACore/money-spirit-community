import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type PostComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
};

const PostComposer = ({ value, onChange, onSubmit, disabled = false }: PostComposerProps) => (
  <Card className="border bg-card shadow-none">
    <CardContent className="p-4 space-y-3">
      <Textarea
        placeholder="Share something with the community..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[80px] bg-background border-input font-body resize-none"
        aria-label="Share something with the community"
      />
      <div className="flex justify-end">
        <Button variant="gold" onClick={onSubmit} disabled={disabled}>
          POST
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default PostComposer;
