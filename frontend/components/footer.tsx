import Link from 'next/link'
import { Container } from './layout'
import { getSiteSettings } from '@/lib/strapi'

export async function Footer() {
  const settings = await getSiteSettings()
  return (
    <footer className="bg-black">
      <Container>
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Hephaestus Labs Institute Section */}
            <div>
              <h3 className="font-semibold text-white mb-4 text-lg">HEPHAESTUS</h3>
              <div className="space-y-2">
                <p>
                  <a
                    href="https://hephaestusinternational.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {settings?.footerText || 'Hephaestus Labs Institute of Experiential Learning Center of Excellence'}
                  </a>
                </p>
                <p>
                  <Link
                    href="/privacy"
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
            
            {/* Our Projects Section */}
            <div>
              <h3 className="font-semibold text-white mb-4 text-lg">OUR PROJECTS</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://www.caipo.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    CAIPO
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.canva.com/design/DAGW8HnZilc/FiHkWHhXQkpkm5jcDU9fLA/view?utm_content=DAGW8HnZilc&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h2e66e71997"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    Moodchanger.ai
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.canva.com/design/DAGYja1TUd4/0uXWmOksp8B2tV22841r9g/view?utm_content=DAGYja1TUd4&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hfe06cf52e4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    Moodchanger for Pets
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.flomadtravel.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    Flo Travel
                  </a>
                </li>
                <li>
                  <a
                    href="https://hephaestusinternational.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    Hephaestus Labs Institute
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.flostudios.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    Flo Studios
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Follow Us Section */}
            <div>
              <h3 className="font-semibold text-white mb-4 text-lg">FOLLOW US</h3>
              {settings?.socialLinks?.linkedin && (
                <a
                  href={settings.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-white/70 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
      </Container>
    </footer>
  )
}
