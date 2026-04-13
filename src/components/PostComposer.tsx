import { Button } from "@/components/ui/button";

type PostComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
};

const PostComposer = ({ value, onChange, onSubmit, disabled = false }: PostComposerProps) => (
  <div className="glass-card">
    <div className="space-y-3">
      <textarea
        placeholder="Share something with the community..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ms-input-dark min-h-[80px] resize-none"
        aria-label="Share something with the community"
      />
      <div className="flex justify-end">
        <Button variant="gold" onClick={onSubmit} disabled={disabled}>
          POST
        </Button>
      </div>
    </div>
  </div>
);

export default PostComposer;
