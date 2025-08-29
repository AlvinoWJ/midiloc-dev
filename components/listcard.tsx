import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import Image from "next/image";
import { StatusBadge } from "@/components/ui/statusbadge";

export function InfoCard() {
  const title = "Alam Sutera";
  const address = "Jln. Ahmad yani 13";
  const code = "12345678";
  const status: "In Progress" | "OK" | "NOK" = "In Progress";
  const date = "25 Agustus 2025";

  return (
    <Card className="w-[330px] shadow-[1px_1px_6px_rgba(0,0,0,0.25)]">
      <CardHeader className="flex flex-row justify-between items-start space-y-0 ">
        <div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{address}</CardDescription>
          <CardDescription>{code}</CardDescription>
        </div>
        <Image
          src="/icons/Edit.png"
          alt="edit Logo"
          width={27}
          height={27}
          className="text-gray-500"
        />
      </CardHeader>

      <CardFooter className="flex justify-between items-center">
        <StatusBadge status={status} />
        <span className="text-gray-700 font-medium">{date}</span>
      </CardFooter>
    </Card>
  );
}
