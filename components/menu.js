import Link from 'next/link';

const Menu = () => {
    return (
        <nav>
            <div className="container" style={{ paddingTop: '30px'}}>
                <Link href="/">
                    Home
                </Link>
                <Link href="/about" style={{ paddingLeft: '40px' }}>
                    About
                </Link>
            </div>
        </nav>
    );
};

export default Menu;