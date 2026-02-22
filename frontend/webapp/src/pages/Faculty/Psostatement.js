import Layout from '../../components/Layout';
import "./Psostatement.css";

const Postatement = () => {
  return (
    <Layout role="FACULTY">
      <div className="bg-white p-4 rounded shadow-sm" style={{ minHeight: '780px' }}>
        <h2
          className="text-center fw-bold mb-4"
          style={{ fontFamily: 'Inter, sans-serif', color: '#1f2f5c', fontSize: '32px' }}
        >
          Program specific outcome (PSO's)
        </h2>
        <hr />
        <div
          className="text-start"
          style={{ fontFamily: 'Inter, sans-serif', color: '#1f2f5c', fontSize: '20px', lineHeight: '1.8' }}
        >
          <p className="mb-3">
            <strong>PSO1 :</strong> Computer Software and Hardware Usage: Use
            state-of-the-art technologies for operation and application of
            computer software and hardware.
          </p>
          <p className="mb-3">
            <strong>PSO2 :</strong> Computer Engineering Maintenance: Maintain
            Computer Engineering related software and hardware systems.
          </p>
          <p className="mb-3">
            <strong>PSO3 :</strong> Apply standard ethical and moral values,
            management principles and soft skills to develop projects for the
            Industry and societal needs.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Postatement;
