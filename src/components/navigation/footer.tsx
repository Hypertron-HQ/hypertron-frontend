import { AnimationContainer } from "@/components"

const Footer = () => {
    return (
        <footer className="flex flex-col relative items-center justify-center border-t border-blue-500/20 md:pb-0 px-6 lg:px-8 w-full max-w-6xl mx-auto lg:pt-32 bg-[radial-gradient(35%_128px_at_50%_0%,rgba(59,130,246,0.06),transparent)]">

            {/* <div className="absolute top-0 left-1/2 right-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1.5 bg-blue-500/60 rounded-full"></div> */}

            <div className=" w-full flex justify-center items-center py-8 px-6">
                <AnimationContainer delay={0.6}>
                    <p className="text-sm text-muted-foreground text-center">
                        &copy; {new Date().getFullYear()} Hypertron. All rights reserved.
                    </p>
                </AnimationContainer>
            </div>

        </footer>
    )
}

export default Footer
