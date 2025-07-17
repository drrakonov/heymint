import { Outlet } from "react-router-dom"

const Layout = () => {
    return (
        <div>
            <nav>
                THis is nav bar
            </nav>
            <main>
                <Outlet />
            </main>
            <footer>
                this is footer
            </footer>
        </div>
    )
}

export default Layout;