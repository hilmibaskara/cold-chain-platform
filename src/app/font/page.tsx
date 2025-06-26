import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakartaSans = Plus_Jakarta_Sans({
    subsets: ["latin"],
    weight: "400",
})

export default function Page() {
    return (
        <div>
            <div>
                <p className={`${plusJakartaSans.className}`}>
                    Plus Jakarta Sans
                </p>
            </div>
        </div>
    )
}