"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/client";

export function PrintButton() {
  return (
    <Button
      variant="outline"
      onClick={() => {
        notify.info("Choose “Save as PDF”", "Pick it as the destination in the print dialog.");
        setTimeout(() => window.print(), 600);
      }}
    >
      <Printer /> Print / Save PDF
    </Button>
  );
}
