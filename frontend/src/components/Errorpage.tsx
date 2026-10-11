
const Errorpage = () => {
    return (
        <section className="min-h-screen bg-[#101010] flex items-center">
            <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6 w-full">
                <div className="mx-auto max-w-screen-sm text-center">
                    <h1 className="mb-4 text-5xl sm:text-7xl tracking-tight font-extrabold lg:text-9xl text-accent-hover">
                        404 Error
                    </h1>
                    <p className="mb-4 text-xl sm:text-3xl tracking-tight font-bold text-white md:text-4xl">
                        Something's missing.
                    </p>
                    <p className="mb-4 text-xs sm:text-xl font-light text-gray-400">
                        Sorry, we can't find that page. You'll find lots to explore on the home page.
                    </p>
                    <a
                        href="/"
                        className="inline-flex text-white bg-accent-active hover:bg-accent/40 focus:ring-4 focus:outline-none focus:ring-accent font-medium rounded-lg text-sm px-3 py-1.5 sm:px-5 sm:py-2.5 text-center my-4"
                    >
                        Back to Homepage
                    </a>
                </div>
            </div>
        </section>
    )
}

export default Errorpage;