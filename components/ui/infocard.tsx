import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import Image from "next/image";
import { StatusBadge } from "@/components/ui/statusbadge";
import Link from "next/link";

type InfoCardProps = {
  id: string;
  nama: string;
  alamat: string;
  created_at: string;
  status: string;
  detailPath: string;
};

export function InfoCard({
  id,
  nama,
  alamat,
  created_at,
  status,
  detailPath,
}: InfoCardProps) {
  // Format tanggal jadi lebih rapi
  const formattedDate = new Date(created_at).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Link href={`${detailPath}/${id}`}>
      <Card className="w-full shadow-[1px_1px_6px_rgba(0,0,0,0.25)] hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row justify-between items-start space-y-0">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl capitalize truncate">
              {nama}
            </CardTitle>
            <CardDescription className="truncate w-[230px] text-gray-700 text-m font-medium">
              {alamat}
            </CardDescription>
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
          <span className="text-gray-700 text-m font-medium">
            {formattedDate}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
