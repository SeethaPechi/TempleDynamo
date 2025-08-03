import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getRoleDisplayName } from "@/lib/authUtils";
import { useTranslation } from "react-i18next";

export function LoginForm() {
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const { login, isLoginLoading, loginError } = useAuth();
  const { toast } = useToast();

  const handleLogin = () => {
    if (!selectedRole) {
      toast({
        title: "Error",
        description: "Please select a role to continue",
        variant: "destructive",
      });
      return;
    }

    login(selectedRole, {
      onSuccess: () => {
        toast({
          title: "Login Successful",
          description: `Welcome! You are logged in as ${getRoleDisplayName(selectedRole)}`,
        });
      },
      onError: (error: any) => {
        toast({
          title: "Login Failed",
          description: error.message || "Failed to login. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-temple-gold/20 to-temple-brown/10 p-4">
      <Card className="w-full max-w-md border border-temple-gold/20 shadow-xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-temple-brown">
            {t("auth.loginTitle")}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {t("auth.loginDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-temple-brown">
              {t("auth.selectRole")}
            </label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="border border-temple-gold/30 focus:border-temple-gold">
                <SelectValue placeholder={t("auth.chooseRole")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system_admin">
                  {t("auth.roles.systemAdmin")}
                </SelectItem>
                <SelectItem value="temple_admin">
                  {t("auth.roles.templeAdmin")}
                </SelectItem>
                <SelectItem value="temple_guest">
                  {t("auth.roles.templeGuest")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loginError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              {loginError.message}
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={isLoginLoading || !selectedRole}
            className="w-full bg-temple-gold hover:bg-yellow-500 text-temple-brown font-semibold py-2.5"
          >
            {isLoginLoading ? t("auth.loggingIn") : t("auth.login")}
          </Button>

          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>{t("auth.demoNote")}</p>
            <div className="space-y-1">
              <p><strong>{t("auth.roles.systemAdmin")}:</strong> {t("auth.permissions.systemAdmin")}</p>
              <p><strong>{t("auth.roles.templeAdmin")}:</strong> {t("auth.permissions.templeAdmin")}</p>
              <p><strong>{t("auth.roles.templeGuest")}:</strong> {t("auth.permissions.templeGuest")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}