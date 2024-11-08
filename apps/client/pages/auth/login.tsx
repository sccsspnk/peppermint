import { toast } from "@/shadcn/hooks/use-toast";
import useTranslation from "next-translate/useTranslation";
import { setCookie } from "cookies-next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Login({}) {
  const router = useRouter();
  const { t } = useTranslation("peppermint");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [auth, setAuth] = useState("oauth");
  const [url, setUrl] = useState("");

  async function postData() {
    await fetch(`/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => res.json())
      .then(async (res) => {
        if (res.user) {
          setCookie("session", res.token);
          if (res.user.external_user) {
            router.push("/portal");
          } else {
            if (res.user.firstLogin) {
              router.push("/onboarding");
            } else {
              router.push("/");
            }
          }
        } else {
          toast({
            variant: "destructive",
            title: t("error__title__auth_login__signin"),
            description: t("error__body__auth_login__signin"),
          });
        }
      });
  }

  async function oidcLogin() {
    await fetch(`/api/v1/auth/check`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.url) {
          setUrl(res.url);
        } else {
          if (!res.success) {
            toast({
              variant: "destructive",
              title: t("error__title__auth_login__signin"),
              description: t("error__body__auth_login__signin"),
            });
          }
        }
      });
  }

  useEffect(() => {
    oidcLogin();
  }, []);

  useEffect(() => {
    if (router.query.error) {
      toast({
        variant: "destructive",
        title: t("error__title__auth_login__signin_sso"),
        description: t("error__body__auth_login__signin_sso"),
      });
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          {t("label__auth_login__welcome")}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {status === "loading" ? (
          <div className="text-center mr-4">{/* <Loader size={32} /> */}</div>
        ) : (
          <div className="bg-background py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground"
                >
                  {t("commonly_used__email")}
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border text-gray-900 border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    onKeyPress={(event) => {
                      if (event.key.toLowerCase() === "Enter") {
                        postData();
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground"
                >
                  {t("commonly_used__password")}
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="password"
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border text-gray-900 border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    onKeyPress={(event) => {
                      if (event.key.toLowerCase() === "Enter") {
                        postData();
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    href="/auth/forgot-password"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    {t("label__auth_login__forgot_password")}
                  </Link>
                </div>
              </div>

              <div className="flex flex-col space-y-4">
                <button
                  type="submit"
                  onClick={postData}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {t("label__button__auth_login__signin")}
                </button>

                {url && (
                  <button
                    type="submit"
                    onClick={() => router.push(url)}
                    className="w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    {t("label__button__auth_login__signin_with_oidc")}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center flex flex-col space-y-2">
          <span className="font-bold text-foreground">
            {t("commonly_used__copyright")}
          </span>
          <a
            href="https://docs.peppermint.sh/"
            target="_blank"
            className="text-foreground"
          >
            {t("commonly_used__documentation")}
          </a>
        </div>
      </div>
    </div>
  );
}
