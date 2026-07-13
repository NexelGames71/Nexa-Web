import ImagesLibrary from "../../components/app/ImagesLibrary";

export const metadata = {
  title: "Images",
  description: "View images generated with Nexa.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ImagesPage() {
  return <ImagesLibrary />;
}
