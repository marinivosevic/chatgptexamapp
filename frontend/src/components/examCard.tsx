import { background } from "@/constants/images";
import React from "react";
import Image from "next/image";

interface NewsCardProps {
  title: string;
  description: string;
  imageSrc: string;
  tag: string;
  id: string;
}

const ExamCard: React.FC<NewsCardProps> = ({
 
}) => {
  const fallbackImage = "/default-news.jpg"; // Ensure this image exists in your public folder

  return (
    <div className="bg-primary-800 rounded-lg shadow-md overflow-hidden transition-transform transform hover:scale-105 hover:cursor-pointer">
      <Image
        src={background}
        alt="News Image"
        className="w-full h-32 object-cover"
        width={400}
        height={400}
      />
      <div className="p-2">
        {/* <div className="flex items-center mb-1">
                    <Badge>
                        <FaTags className="text-white mr-1" />
                        <span className="text-xs text-gray-300">{tag}</span>
                    </Badge>
                </div> */}
        <h2 className="text-lg font-semibold text-gray-700 mb-1">
          Bašćanska ploća
        </h2>
        <p className="text-xs text-gray-600 line-clamp-2">
          Ja, u ime oca i Sina i Svetoga Duha. Ja opat Držiha pisah ovo o ledini
          koju dade Zvonimir, kralj hrvatski u dane svoje svetoj Luciji.
          Svjedoče mi župan Desimir u Krbavi, Martin u Li- ci, Piribineg u
          Vinodolu i Jakov na o- toku. Da tko poreče, neka ga prokune i Bog i 12
          apostola i 4 e- vanđelista i sveta Lucija. Amen. Neka onaj tko ovdje
          živi, moli za njih Boga. Ja opat Dobrovit zi- dah crkvu ovu sa svoje
          dev- etero braće u dane kneza Kosmata koji je vl- adao cijelom
          Krajinom. I bijaše u te dane Mi- kula u Otočcu sa svetom Lucijom
          zajedno.
        </p>
      </div>
    </div>
  );
};

export default ExamCard;