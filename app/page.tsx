import Button from "@/components/button";
import Card from "@/components/card";
import Alert from "@/components/alert";
import Spinner from "@/components/spinner";

export default function Home() {
  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-4">UI Components Test</h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Buttons</h3>
            <div className="flex gap-2">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" isLoading>
                Loading
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Alerts</h3>
            <div className="space-y-2">
              <Alert type="success">Success message</Alert>
              <Alert type="error">Error message</Alert>
              <Alert type="warning">Warning message</Alert>
              <Alert type="info">Info message</Alert>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Spinner</h3>
            <div className="flex gap-4 items-center">
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
