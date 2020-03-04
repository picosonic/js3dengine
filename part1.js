// Based on tutorial at https://www.youtube.com/watch?v=ih20l3pJoeU by @Javidx9
// Part #1 - Triangles & Projections

// Global constants
const xmax=1280;
const ymax=720;

// Projection matrix values
const fnear=0.1; // Near plane (Z)
const ffar=1000; // Far plane (Z)
const ffov=90; // Field of view in degrees
const faspectratio=ymax/xmax; // Screen aspect ratio
const ffovrad=1/Math.tan((ffov/2)/(180*Math.PI)); // Tangent of field of view calculation in radians

// Game state is global to prevent it going out of scope
var gs=null;

// Deep clone an object
function deepclone(obj)
{
  return JSON.parse(JSON.stringify(obj));
}

// ***************************************************************************

// Single vertex
class vec3d
{
  constructor(x, y, z)
  {
    this.x=x||0;
    this.y=y||0;
    this.z=z||0;
  }

  set(x, y, z)
  {
    this.x=x||0;
    this.y=y||0;
    this.z=z||0;
  }
}

// Simplest 3D primative, contains 3 vertices
class triangle
{
  constructor(a, b, c)
  {
    this.p=new Array(3);

    if ((a==undefined) && (b==undefined) && (c==undefined))
    {
      var tri=new vec3d(0, 0, 0);

      this.p[0]=deepclone(tri);
      this.p[1]=deepclone(tri);
      this.p[2]=deepclone(tri);
    }
    else
    {
      this.p[0]=deepclone(a);
      this.p[1]=deepclone(b);
      this.p[2]=deepclone(c);
    }
  }
}

// Contains a collection of triangles
class mesh
{
  constructor()
  {
    this.tris=[];
  }

  addtri(tri)
  {
    this.tris.push(deepclone(tri));
  }

  addface(x1, y1, z1, x2, y2, z2, x3, y3, z3)
  {
    var t1=new vec3d(x1, y1, z1);
    var t2=new vec3d(x2, y2, z2);
    var t3=new vec3d(x3, y3, z3);
    var tri=new triangle(t1, t2, t3);

    this.addtri(tri);
  }

  len()
  {
    return this.tris.length;
  }

  get(n)
  {
    return this.tris[n];
  }
}

class mat4x4
{
  constructor()
  {
    this.m=new Array(4*4);
    this.m.fill(0);
  }

  set(x, y, value)
  {
    this.m[(y*4)+x]=value;
  }

  get(x, y)
  {
    return this.m[(y*4)+x];
  }
}

class engine3D
{
  constructor()
  {
    // Save canvas object and 2d context for it
    this.canvas=document.getElementById('canvas');
    this.ctx=this.canvas.getContext('2d');

    this.ctx.strokeStyle="rgba(255,255,255,1)";
    this.ctx.lineWidth=1;

    // Timestamp for start of render
    this.starttime=null;

    this.meshcube=new mesh();
    this.matproj=new mat4x4();

    this.theta=0;

    this.matproj.set(0, 0, faspectratio*ffovrad);
    this.matproj.set(1, 1, ffovrad);
    this.matproj.set(2, 2, ffar/(ffar-fnear));
    this.matproj.set(3, 2, (-ffar*fnear)/(ffar-fnear));
    this.matproj.set(2, 3, 1);
    this.matproj.set(3, 3, 0);

    // Define cube using faces with clockwise vertices

    // SOUTH
    this.meshcube.addface( 0, 0, 0,    0, 1, 0,    1, 1, 0 );
    this.meshcube.addface( 0, 0, 0,    1, 1, 0,    1, 0, 0 );

    // EAST
    this.meshcube.addface( 1, 0, 0,    1, 1, 0,    1, 1, 1 );
    this.meshcube.addface( 1, 0, 0,    1, 1, 1,    1, 0, 1 );

    // NORTH
    this.meshcube.addface( 1, 0, 1,    1, 1, 1,    0, 1, 1 );
    this.meshcube.addface( 1, 0, 1,    0, 1, 1,    0, 0, 1 );

    // WEST
    this.meshcube.addface( 0, 0, 1,    0, 1, 1,    0, 1, 0 );
    this.meshcube.addface( 0, 0, 1,    0, 1, 0,    0, 0, 0 );

    // TOP
    this.meshcube.addface( 0, 1, 0,    0, 1, 1,    1, 1, 1 );
    this.meshcube.addface( 0, 1, 0,    1, 1, 1,    1, 1, 0 );

    // BOTTOM
    this.meshcube.addface( 1, 0, 1,    0, 0, 1,    0, 0, 0 );
    this.meshcube.addface( 1, 0, 1,    0, 0, 0,    1, 0, 0 );
  }

  // Start engine running
  start()
  {
    window.requestAnimationFrame(this.drawframe.bind(this));
  }

  // Draw triangle
  drawtriangle(tri)
  {
    this.ctx.beginPath();

    for (var j=0; j<3; j++)
      this.ctx.lineTo(tri.p[j].x, tri.p[j].y);

    this.ctx.lineTo(tri.p[0].x, tri.p[0].y);

    this.ctx.stroke();
  }

  // Draw the whole frame
  drawframe(timestamp)
  {
    if (!this.starttime) this.starttime=timestamp;
    var progress=(timestamp-this.starttime)/5000;

    // Clear screen
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up rotation matrices
    var matrotz=new mat4x4();
    var matrotx=new mat4x4();
    this.theta+=0.05;
    this.theta%=(4*Math.PI);

    // Rotation Z
    matrotz.set(0, 0, Math.cos(this.theta));
    matrotz.set(0, 1, Math.sin(this.theta));
    matrotz.set(1, 0, -Math.sin(this.theta));
    matrotz.set(1, 1, Math.cos(this.theta));
    matrotz.set(2, 2, 1);
    matrotz.set(3, 3, 1);

    // Rotation X
    matrotx.set(0, 0, 1);
    matrotx.set(1, 1, Math.cos(this.theta/2));
    matrotx.set(1, 2, Math.sin(this.theta/2));
    matrotx.set(2, 1, -Math.sin(this.theta/2));
    matrotx.set(2, 2, Math.cos(this.theta/2));
    matrotx.set(3, 3, 1);

    // Draw triangles
    for (var i=0; i<this.meshcube.len(); i++)
    {
      var trirotatedz=new triangle();
      var trirotatedzx=new triangle();
      var triprojected=new triangle();
      var tritranslated;
      var tri=this.meshcube.get(i);

      // Rotate in Z-Axis
      this.multiplymatrixvector(tri.p[0], trirotatedz.p[0], matrotz);
      this.multiplymatrixvector(tri.p[1], trirotatedz.p[1], matrotz);
      this.multiplymatrixvector(tri.p[2], trirotatedz.p[2], matrotz);

      // Rotate in X-Axis
      this.multiplymatrixvector(trirotatedz.p[0], trirotatedzx.p[0], matrotx);
      this.multiplymatrixvector(trirotatedz.p[1], trirotatedzx.p[1], matrotx);
      this.multiplymatrixvector(trirotatedz.p[2], trirotatedzx.p[2], matrotx);

      // Offset into the screen
      tritranslated=deepclone(trirotatedzx);
      tritranslated.p[0].z=trirotatedzx.p[0].z+20;
      tritranslated.p[1].z=trirotatedzx.p[1].z+20;
      tritranslated.p[2].z=trirotatedzx.p[2].z+20;

      // Project triangles from 3D --> 2D
      this.multiplymatrixvector(tritranslated.p[0], triprojected.p[0], this.matproj);
      this.multiplymatrixvector(tritranslated.p[1], triprojected.p[1], this.matproj);
      this.multiplymatrixvector(tritranslated.p[2], triprojected.p[2], this.matproj);

      // Scale into view
      triprojected.p[0].x+=1; triprojected.p[0].y+=1;
      triprojected.p[1].x+=1; triprojected.p[1].y+=1;
      triprojected.p[2].x+=1; triprojected.p[2].y+=1;
      triprojected.p[0].x*=xmax/2;
      triprojected.p[0].y*=ymax/2;
      triprojected.p[1].x*=xmax/2;
      triprojected.p[1].y*=ymax/2;
      triprojected.p[2].x*=xmax/2;
      triprojected.p[2].y*=ymax/2;

      // Rasterise triangle
      this.drawtriangle(triprojected);
    }

    // Ask to be called again on the next frame
    window.requestAnimationFrame(this.drawframe.bind(this));
  }

  // Matrix vector multiplication from input triangle to output triangle using 4x4 matrix
  multiplymatrixvector(i, o, m)
  {
    o.x = i.x * m.get(0, 0) + i.y * m.get(1, 0) + i.z * m.get(2, 0) + m.get(3, 0);
    o.y = i.x * m.get(0, 1) + i.y * m.get(1, 1) + i.z * m.get(2, 1) + m.get(3, 1);
    o.z = i.x * m.get(0, 2) + i.y * m.get(1, 2) + i.z * m.get(2, 2) + m.get(3, 2);

    // Fourth element for 4x4 matrix
    var w = i.x * m.get(0, 3) + i.y * m.get(1, 3) + i.z * m.get(2, 3) + m.get(3, 3);

    // Convert from 4D to 3D cartesian coordinates when w is not 0
    if (w!=0)
    {
      o.x/=w;
      o.y/=w;
      o.z/=w;
    }
  }
}

// ***************************************************************************

// Handle screen resizing to maintain correctly centered display
function resize()
{
  var height=window.innerHeight;
  var ratio=xmax/ymax;
  var width=Math.floor(height*ratio);
  var top=0;
  var left=Math.floor((window.innerWidth/2)-(width/2));

  if (width>window.innerWidth)
  {
    width=window.innerWidth;
    ratio=ymax/xmax;
    height=Math.floor(width*ratio);

    left=0;
    top=Math.floor((window.innerHeight/2)-(height/2));
  }

  canvas.style.top=top+"px";
  canvas.style.left=left+"px";

  canvas.style.width=width+"px";
  canvas.style.height=height+"px";
}

// Called as initial entry point once page is loaded
function startup()
{
  resize();
  window.addEventListener("resize", resize);

  gs=new engine3D;
  gs.start();
}

