"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { createProject } from "@/lib/project";

interface Props {
  triggerLabel?: string;
  variant?: "default" | "outline";
}

export const CreateProjectDialog = ({
  triggerLabel = "Start Designing",
  variant = "outline",
}: Props) => {
  const router = useRouter();
  const { accessToken } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isInvitationDialogOpen, setIsInvitationDialogOpen] = useState(false);
  const [inputLink, setInputLink] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await createProject(
        {
          name: projectName,
          description: projectDescription,
        },
        accessToken!
      );

      console.log("Proyecto creado:", response);
      setProjectName("");
      setProjectDescription("");
      setInvitationLink(response.invitation_link);
      setIsOpen(false);
      setIsSuccessDialogOpen(true);
    } catch (error) {
      console.error("Error al crear el proyecto:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (invitationLink) {
      navigator.clipboard
        .writeText(invitationLink)
        .then(() => console.log("Enlace copiado al portapapeles"))
        .catch((err) => console.error("Error al copiar el enlace:", err));
    }
  };

  const handleRedirect = () => {
    if (invitationLink) {
      const code = invitationLink.split("/").pop();
      if (code) {
        localStorage.setItem("current_invitation_code", code);
      }
      router.push("/grapesjs");
    }
  };

  const handleInvitationLinkSubmit = () => {
    if (inputLink) {
      try {
        // Extraer el código UUID desde el link
        const code = inputLink.split("/").pop();
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
        if (code && uuidRegex.test(code)) {
          localStorage.setItem("current_invitation_code", code); 
          setInvitationLink(inputLink);
          setIsInvitationDialogOpen(false);
          setInputLink(""); // Opcional: limpia el input
          router.push("/grapesjs"); // NAVEGAMOS A GRAPESJS para conectarnos
        } else {
          alert("❌ El link de invitación es inválido. Por favor revisa e intenta nuevamente.");
        }
      } catch (error) {
        console.error("Error validando el link:", error);
        alert("❌ El link de invitación es inválido. Por favor revisa e intenta nuevamente.");
      }
    }
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            asChild
            variant={variant}
            className="ml-2 border-primary/50 text-primary hover:text-white hover:bg-primary/10"
          >
            <span>{triggerLabel}</span>
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md bg-[#0F111A] rounded-xl shadow-lg">
          <DialogTitle className="text-xl font-medium">
            Create New Project
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Enter the details for your new project
          </DialogDescription>

          <form onSubmit={handleSubmit} className="space-y-6 py-4 text-white">
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="projectName"
                  className="text-sm font-semibold mb-1.5 block"
                >
                  Project Name
                </label>
                <input
                  type="text"
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#181B29] border border-[#3C3F4E] text-white rounded-md text-sm 
        focus:outline-none focus:ring-2 focus:ring-[#00CFFF] transition-shadow"
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="projectDescription"
                  className="text-sm font-semibold mb-1.5 block"
                >
                  Project Description
                </label>
                <textarea
                  id="projectDescription"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#181B29] border border-[#3C3F4E] text-white rounded-md text-sm 
        focus:outline-none focus:ring-2 focus:ring-[#00CFFF] min-h-24 resize-none transition-shadow"
                  placeholder="Describe your project"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1.5 block">
                  Do you have an invitation link?
                </label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInvitationDialogOpen(true)}
                  className="w-full px-3 py-2 bg-[#181B29] border border-[#3C3F4E] text-white rounded-md text-sm hover:bg-[#23263a]"
                >
                  Enter Invitation Link
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="px-4 text-white border border-[#3C3F4E] hover:bg-[#23263a]"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-4 bg-[#00CFFF] hover:bg-[#00b5e6] text-black font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isInvitationDialogOpen}
        onOpenChange={setIsInvitationDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-xl font-medium">
            Enter Invitation Link
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Enter the invitation link to go to the specific project.
          </DialogDescription>

          <div className="space-y-2">
            <label htmlFor="invitationLink" className="text-sm font-medium">
              Invitation Link
            </label>
            <input
              type="text"
              id="invitationLink"
              value={inputLink}
              onChange={(e) => setInputLink(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm 
              focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
              placeholder="Enter invitation link"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleInvitationLinkSubmit}
              className="px-4"
            >
              Go to Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-xl font-medium">
            Project Created Successfully
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Your project has been created. You can now use the invitation link.
          </DialogDescription>

          {invitationLink && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Invitation Link:</p>
              <input
                type="text"
                value={invitationLink}
                readOnly
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm 
                focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className="px-4"
            >
              Copy Link
            </Button>
            <Button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4"
              onClick={handleRedirect}
            >
              Go to GrapesJS
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
