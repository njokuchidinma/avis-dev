"use client";

import { useForm } from "react-hook-form";

interface FormValues {
  email: string;
}

export function ExampleForm() {
  const { handleSubmit, register } = useForm<FormValues>();

  return (
    <form onSubmit={handleSubmit(() => undefined)}>
      <input type="email" {...register("email")} />
      <button type="submit">Submit</button>
    </form>
  );
}
