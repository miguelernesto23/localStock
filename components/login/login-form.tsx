import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/schema/login.schema";
import { LoginAction } from "@/action/auth/login.action";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      user_name: "",
      password: "",
    },
  });
  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);

    try {
      const formData = new FormData();

      formData.append("user_name", data.user_name);
      formData.append("password", data.password);

      const result = await LoginAction(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="user_name">Usuario</label>

        <Input
          id="user_name"
          type="text"
          placeholder="Ingresa tu usuario"
          {...register("user_name")}
        />

        {errors.user_name && (
          <p className="animate-in fade-in slide-in-from-top-1 duration-200 text-sm text-red-500">
            {errors.user_name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password">Contraseña</label>

        <Input
          id="password"
          type="password"
          placeholder="Ingresa tu contraseña"
          {...register("password")}
        />

        {errors.password && (
          <p className="animate-in fade-in slide-in-from-top-1 duration-200 text-sm text-red-500">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Iniciando sesión...
          </>
        ) : (
          "Iniciar sesión"
        )}
      </Button>
    </form>
  );
}
