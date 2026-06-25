import { Col, Container, Row } from "react-bootstrap";
import UserShow from "@/src/app/components/userShow";


const Page = () => {
    return (
        <section className="mainSection">
            <Container>
                <Row>
                    <Col md={12}>
                        <UserShow />
                    </Col>
                </Row>
            </Container>
        </section>
    )
}

export default Page