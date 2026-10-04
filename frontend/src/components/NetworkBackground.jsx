import { motion } from "motion/react";


const nodes = [
  { x: "18%", y: "25%" },
  { x: "28%", y: "42%" },
  { x: "20%", y: "65%" },
  { x: "38%", y: "30%" },
  { x: "42%", y: "65%" },
  { x: "55%", y: "22%" },
  { x: "62%", y: "42%" },
  { x: "74%", y: "28%" },
  { x: "78%", y: "65%" },
  { x: "60%", y: "72%" }
];


const lines = [
  [0, 1],
  [1, 2],
  [0, 3],
  [3, 4],
  [1, 4],
  [3, 5],
  [5, 6],
  [5, 7],
  [6, 8],
  [6, 9],
  [4, 9]
];


export default function NetworkBackground({ animate = true }) {

  return (

    <div className="network-background">

      <svg
        className="network-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >

        {lines.map(([from, to], index) => {

          const start = nodes[from];
          const end = nodes[to];

          return (

            <motion.line
              key={index}

              x1={parseFloat(start.x)}
              y1={parseFloat(start.y)}

              x2={parseFloat(end.x)}
              y2={parseFloat(end.y)}

              className="network-line"

              initial={animate ? { opacity: 0 } : false}
              animate={{ opacity: animate ? 0.22 : 0.12 }}
              transition={{ duration: animate ? 1 : 0, delay: animate ? index * 0.1 : 0 }}
            />

          );

        })}

      </svg>


      {nodes.map((node, index) => (

        <motion.div
          key={index}
          className="network-node"

          style={{
            left: node.x,
            top: node.y
          }}

          animate={animate ? {
            scale: [1, 1.15, 1],
            opacity: [0.6, 1, 0.6]
          } : { scale: 1, opacity: 0.45 }}
          transition={animate ? {
            duration: 2,
            delay: index * 0.15,
            repeat: Infinity,
            repeatDelay: 2
          } : { duration: 0 }}
        />

      ))}


    </div>

  );
}