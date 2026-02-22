import Layout from "../../components/Layout";
import "./Postatement.css";

const Postatement = () => {
  return (
    <Layout role="HOD"> {/* Replace HOD with the correct role for the page */}
      <div className="bg-white p-4 rounded shadow-sm" style={{ minHeight: "780px" }}>
        <h2
          className="text-center fw-bold mb-4"
          style={{ fontFamily: "Inter, sans-serif", color: "#1f2f5c", fontSize: "32px" }}
        >
          Program specific outcome (PSO's)
        </h2>
        <hr />
        <div
          className="text-start"
          style={{ fontFamily: "Inter, sans-serif", color: "#1f2f5c", fontSize: "20px", lineHeight: "1.8" }}
        >
          <p className="mb-3">
            <strong>PO1 :</strong> Basic and Discipline specific knowledge: Apply knowledge of basic mathematics,
            science and engineering fundamentals and engineering specialization to solve the engineering problems.
          </p>

          <p className="mb-3">
            <strong>PO2 :</strong> Problem analysis: Identify and analyse well-defined engineering problems using codified standard methods.
          </p>

          <p className="mb-3">
            <strong>PO3 :</strong> Design/ development of solutions: Design solutions for well-defined technical problems and
            assist with the design of systems components or processes to meet specified needs.
          </p>

          {/* Other POs go here */}
        </div>
      </div>
    </Layout>
  );
};

export default Postatement;
