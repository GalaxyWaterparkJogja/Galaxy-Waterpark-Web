import Image from "next/image";
import type { LandingAbout } from "@/types/landing";
import { StoredImage } from "@/components/ui";
import { sectionTitleClassName } from "../../components/section-heading";
import { LandingReveal } from "../../components/landing-reveal";
import styles from "./about.module.css";

function Paragraph({ text, emphasis }: LandingAbout["paragraphs"][number]) {
  if (!emphasis || !text.includes(emphasis)) return <p>{text}</p>;
  const start = text.indexOf(emphasis);
  return (
    <p>
      {text.slice(0, start)}
      <strong>{emphasis}</strong>
      {text.slice(start + emphasis.length)}
    </p>
  );
}

export function About({ content }: { content: LandingAbout }) {
  return (
    <section
      id="about"
      className={`${styles.section} relative`}
      aria-labelledby="about-heading"
    >
      <LandingReveal revealId="about/heading" className={styles.heading}>
        <h2 id="about-heading" className={sectionTitleClassName}>
          {content.title}
        </h2>
      </LandingReveal>
      <div className={`${styles.visual} relative`}>
        <div className={`${styles.backdrop} absolute overflow-hidden`}>
          <Image
            src={content.backdrop_url}
            alt=""
            width={3024}
            height={3024}
            sizes="(min-width: 769px) 800px, 100vw"
          />
        </div>
        <div className={`${styles.photo} relative overflow-hidden`}>
          <StoredImage
            src={content.image_url}
            alt={content.image_alt}
            className="object-cover"
          />
        </div>
      </div>
      <LandingReveal revealId="about/copy" index={1} className={`${styles.copy} flex flex-col justify-center`}>
        <div>
          {content.paragraphs.map((paragraph, index) => (
            <Paragraph key={index} {...paragraph} />
          ))}
        </div>
      </LandingReveal>
    </section>
  );
}
