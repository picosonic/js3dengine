// Based on tutorial at https://www.youtube.com/watch?v=HXSuNxpCzdM by @Javidx9
// Part #3 - Cameras & Clipping

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
    this.w=1; // Need a 4th term to perform sensible matrix vector multiplication
  }

  set(x, y, z)
  {
    this.x=x||0;
    this.y=y||0;
    this.z=z||0;
  }

  clone()
  {
    return new vec3d(this.x, this.y, this.z);
  }
}

// Simplest 3D primative, contains 3 vertices
class triangle
{
  constructor(a, b, c, s)
  {
    this.p=new Array(3);

    // How illuminated the triangle is 1=100%
    if (s==undefined)
      this.shade=1;
    else
      this.shade=s;

    if ((a==undefined) && (b==undefined) && (c==undefined))
    {
      this.p[0]=new vec3d();
      this.p[1]=new vec3d();
      this.p[2]=new vec3d();
    }
    else
    {
      this.p[0]=a.clone();
      this.p[1]=b.clone();
      this.p[2]=c.clone();
    }
  }

  clone()
  {
    return new triangle(this.p[0], this.p[1], this.p[2], this.shade);
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
    this.tris.push(tri.clone());
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

  loadfromobject(obj)
  {
    for (var i=0; i<obj.f.length; i++)
    {
      var v1=obj.f[i][0];
      var v2=obj.f[i][1];
      var v3=obj.f[i][2];

      this.addface(obj.v[v1-1][0], obj.v[v1-1][1], obj.v[v1-1][2],
                   obj.v[v2-1][0], obj.v[v2-1][1], obj.v[v2-1][2],
                   obj.v[v3-1][0], obj.v[v3-1][1], obj.v[v3-1][2]);
    }
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
    this.ctx=this.canvas.getContext('2d', { alpha: false });

    // Timestamp for last render
    this.lasttime=null;

    this.meshcube=new mesh();
    this.meshcube.loadfromobject(axis);

    this.matproj=this.Matrix_MakeProjection(ffov, faspectratio, fnear, ffar);

    this.vcamera=new vec3d(0, 0, 0); // Location of camera in world space
    this.vlookdir=new vec3d(0, 0, 0); // Direction vector along the direction camera points
    this.fyaw=0; // FPS camera rotation in Y axis (XZ plane)
    this.ftheta=0; // Spins world transform
  }

  // Start engine running
  start()
  {
    window.requestAnimationFrame(this.drawframe.bind(this));
  }

  clearinputstate()
  {
    keystate=0;
    padstate=0;
  }

  ispressed(keybit)
  {
    return (((keystate&keybit)!=0) || ((padstate&keybit)!=0));
  }

  // Draw triangle
  drawtriangle(tri)
  {
    this.ctx.fillStyle=tri.shade;
    this.ctx.strokeStyle=tri.shade;

    this.ctx.beginPath();

    this.ctx.moveTo(Math.floor(tri.p[0].x), Math.floor(tri.p[0].y));

    for (var j=1; j<3; j++)
      this.ctx.lineTo(Math.floor(tri.p[j].x), Math.floor(tri.p[j].y));

    this.ctx.closePath();

    this.ctx.fill();
    this.ctx.stroke();
  }

  // Draw the whole frame
  drawframe(timestamp_milli)
  {
    var progress=0;
    var vforward=null;

    // Determine time in seconds since the last drawframe()
    if (this.lasttime!=null)
      progress=(timestamp_milli-this.lasttime)/1000;

    this.lasttime=timestamp_milli;

    if (!!(navigator.getGamepads))
    {
      gamepadscan();

      this.vcamera.x -= (gamepadaxesval[2]*(progress*8)); // Along X axis
      this.vcamera.y -= (gamepadaxesval[3]*(progress*8)); // Up/Down

      vforward=this.Vector_Mul(this.vlookdir, (gamepadaxesval[1]*(progress*8)));

      this.vcamera=this.Vector_Add(this.vcamera, vforward);
      this.fyaw -= (gamepadaxesval[0]*(progress*2));
    }

    if (this.ispressed(2))
      this.vcamera.y += (progress*8);

    if (this.ispressed(8))
      this.vcamera.y -= (progress*8);

    if (this.ispressed(1))
      this.vcamera.x += (progress*8);

    if (this.ispressed(4))
      this.vcamera.x -= (progress*8);

    vforward=this.Vector_Mul(this.vlookdir, (progress*8));

    if (this.ispressed(32))
      this.vcamera=this.Vector_Add(this.vcamera, vforward);

    if (this.ispressed(64))
      this.vcamera=this.Vector_Sub(this.vcamera, vforward);

    if (this.ispressed(128))
      this.fyaw -= (progress*2);

    if (this.ispressed(256))
      this.fyaw += (progress*2);

    // Set up world transform matrices
    var matrotz=this.Matrix_MakeRotationZ(this.ftheta*0.5);
    var matrotx=this.Matrix_MakeRotationX(this.ftheta);

    var mattrans=this.Matrix_MakeTranslation(0, 0, 5);

    var matworld=this.Matrix_MakeIdentity(); // Form World Matrix
    matworld=this.Matrix_MultiplyMatrix(matrotz, matrotx); // Transform by rotation
    matworld=this.Matrix_MultiplyMatrix(matworld, mattrans); // Transform by translation

    // Create "Point At" Matrix for camera
    var vup=new vec3d(0, 1, 0);
    var vtarget=new vec3d(0, 0, 1);
    var matcamerarot=this.Matrix_MakeRotationY(this.fyaw);
    this.vlookdir=this.Matrix_MultiplyVector(matcamerarot, vtarget);
    vtarget=this.Vector_Add(this.vcamera, this.vlookdir);
    var matcamera=this.Matrix_PointAt(this.vcamera, vtarget, vup);

    // Make view matrix from camera
    var matview=this.Matrix_QuickInverse(matcamera);

    // Store triagles for rastering later
    var trianglestoraster=new Array();

    // Draw triangles
    for (var i=0; i<this.meshcube.len(); i++)
    {
      var triprojected=new triangle();
      var tritransformed=new triangle();
      var triviewed=new triangle();

      var tri=this.meshcube.get(i);

      // World Matrix Transform
      tritransformed.p[0]=this.Matrix_MultiplyVector(matworld, tri.p[0]);
      tritransformed.p[1]=this.Matrix_MultiplyVector(matworld, tri.p[1]);
      tritransformed.p[2]=this.Matrix_MultiplyVector(matworld, tri.p[2]);

      // Calculate triangle normal
      // Get lines either side of triangle
      var line1=this.Vector_Sub(tritransformed.p[1], tritransformed.p[0]);
      var line2=this.Vector_Sub(tritransformed.p[2], tritransformed.p[0]);

      // Take cross product of lines to get normal to triangle surface
      var normal=this.Vector_CrossProduct(line1, line2);

      // Normalise the normal (give it a length of 1)
      normal=this.Vector_Normalise(normal);

      // Get Ray from triangle to camera
      var vCameraRay=this.Vector_Sub(tritransformed.p[0], this.vcamera);

      // If ray is aligned with normal, then triangle is visible
      if (this.Vector_DotProduct(normal, vCameraRay) < 0)
      {
        // Illumination
        var lightdir=new vec3d(0, 1, -1); // light comes from above viewer
        lightdir=this.Vector_Normalise(lightdir);

        // Dot product between surface normal and light direction
        // How "aligned" are light direction and triangle surface normal?
        var dp=Math.max(0.1, this.Vector_DotProduct(lightdir, normal));
        var equiv=Math.floor(dp*255);

        // Convert World Space --> View Space
        triviewed.p[0]=this.Matrix_MultiplyVector(matview, tritransformed.p[0]);
        triviewed.p[1]=this.Matrix_MultiplyVector(matview, tritransformed.p[1]);
        triviewed.p[2]=this.Matrix_MultiplyVector(matview, tritransformed.p[2]);

        // Clip Viewed Triangle against near plane, this could form two additional triangles. 
        var clipped=new Array(2);
        var nClippedTriangles=this.Triangle_ClipAgainstPlane(new vec3d(0, 0, 0.1), new vec3d(0, 0, 1), triviewed, clipped);

        // We may end up with multiple triangles from the clip, so project as required
        for (var n=0; n<nClippedTriangles; n++)
        {
          // Project triangles from 3D --> 2D
          triprojected.p[0]=this.Matrix_MultiplyVector(this.matproj, clipped[n].p[0]);
          triprojected.p[1]=this.Matrix_MultiplyVector(this.matproj, clipped[n].p[1]);
          triprojected.p[2]=this.Matrix_MultiplyVector(this.matproj, clipped[n].p[2]);

          triprojected.shade="rgba("+equiv+","+equiv+","+equiv+",1)";

          // Scale into view, we moved the normalising into cartesian space
          // out of the matrix.vector function from the previous videos, so
          // do this manually
          triprojected.p[0]=this.Vector_Div(triprojected.p[0], triprojected.p[0].w);
          triprojected.p[1]=this.Vector_Div(triprojected.p[1], triprojected.p[1].w);
          triprojected.p[2]=this.Vector_Div(triprojected.p[2], triprojected.p[2].w);

          // X/Y are inverted so put them back
          triprojected.p[0].x*=-1; triprojected.p[0].y*=-1;
          triprojected.p[1].x*=-1; triprojected.p[1].y*=-1;
          triprojected.p[2].x*=-1; triprojected.p[2].y*=-1;

          // Offset verts into visible normalised space
          var voffsetview=new vec3d(1, 1, 0);
          triprojected.p[0]=this.Vector_Add(triprojected.p[0], voffsetview);
          triprojected.p[1]=this.Vector_Add(triprojected.p[1], voffsetview);
          triprojected.p[2]=this.Vector_Add(triprojected.p[2], voffsetview);

          triprojected.p[0].x*=xmax/2;
          triprojected.p[0].y*=ymax/2;
          triprojected.p[1].x*=xmax/2;
          triprojected.p[1].y*=ymax/2;
          triprojected.p[2].x*=xmax/2;
          triprojected.p[2].y*=ymax/2;

          // Store triangle for Z sorting
          trianglestoraster.push(triprojected);
        }
      }
    }

    // Sort triangles from back to front (using average Z value)
    trianglestoraster.sort(function(t1,t2){return ((t2.p[0].z+t2.p[1].z+t2.p[2].z)/3)-((t1.p[0].z+t1.p[1].z+t1.p[2].z)/3)});

    // Clear screen
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Rasterise transformed, viewed, projected and sorted visible triangles
    for (var i=0; i<trianglestoraster.length; i++)
    {
      // Clip triangles against all four screen edges
      var clipped=new Array(2);
      var listtriangles=[];
      var nnewtriangles=1;

      // Add initial triangle
      listtriangles.push(trianglestoraster[i]);

      for (var p=0; p<4; p++)
      {
        var ntristoadd=0;
        while (nnewtriangles>0)
        {
          // Take triangle from front of queue
          var test=listtriangles.shift();
          nnewtriangles--;

          // Clip it against a planes
          switch (p)
          {
            case 0: // Top
              ntristoadd=this.Triangle_ClipAgainstPlane(new vec3d(0, 0, 0), new vec3d(0, 1, 0), test, clipped);
              break;

            case 1: // Bottom
              ntristoadd=this.Triangle_ClipAgainstPlane(new vec3d(0, ymax-1, 0), new vec3d(0, -1, 0), test, clipped);
              break;

            case 2: // Left
              ntristoadd=this.Triangle_ClipAgainstPlane(new vec3d(0, 0, 0), new vec3d(1, 0, 0), test, clipped);
              break;

            case 3: // Right
              ntristoadd=this.Triangle_ClipAgainstPlane(new vec3d(xmax-1, 0, 0), new vec3d(-1, 0, 0), test, clipped);
              break;
          }

          // Clipping may yield a variable number of triangles, so add to back of queue for additional clipping against next plane(s)
          for (var w=0; w<ntristoadd; w++)
            listtriangles.push(clipped[w]);
        }

        nnewtriangles=listtriangles.length;
      }

      for (var t=0; t<listtriangles.length; t++)
        this.drawtriangle(listtriangles[t]);
    }

    // Ask to be called again on the next frame
    window.requestAnimationFrame(this.drawframe.bind(this));
  }

  Matrix_MultiplyVector(m, i)
  {
    var v=new vec3d();

    v.x = (i.x*m.get(0, 0)) + (i.y*m.get(1, 0)) + (i.z*m.get(2, 0)) + (i.w*m.get(3, 0));
    v.y = (i.x*m.get(0, 1)) + (i.y*m.get(1, 1)) + (i.z*m.get(2, 1)) + (i.w*m.get(3, 1));
    v.z = (i.x*m.get(0, 2)) + (i.y*m.get(1, 2)) + (i.z*m.get(2, 2)) + (i.w*m.get(3, 2));
    v.w = (i.x*m.get(0, 3)) + (i.y*m.get(1, 3)) + (i.z*m.get(2, 3)) + (i.w*m.get(3, 3));

    return v;
  }

  Matrix_MakeIdentity()
  {
    var matrix=new mat4x4();

    matrix.set(0, 0, 1);
    matrix.set(1, 1, 1);
    matrix.set(2, 2, 1);
    matrix.set(3, 3, 1);

    return matrix;
  }

  Matrix_MakeRotationX(fAngleRad)
  {
    var matrix=new mat4x4();

    matrix.set(0, 0, 1);
    matrix.set(1, 1, Math.cos(fAngleRad));
    matrix.set(1, 2, Math.sin(fAngleRad));
    matrix.set(2, 1, -Math.sin(fAngleRad));
    matrix.set(2, 2, Math.cos(fAngleRad));
    matrix.set(3, 3, 1);

    return matrix;
  }

  Matrix_MakeRotationY(fAngleRad)
  {
    var matrix=new mat4x4();

    matrix.set(0, 0, Math.cos(fAngleRad));
    matrix.set(0, 2, Math.sin(fAngleRad));
    matrix.set(2, 0, -Math.sin(fAngleRad));
    matrix.set(1, 1, 1);
    matrix.set(2, 2, Math.cos(fAngleRad));
    matrix.set(3, 3, 1);

    return matrix;
  }

  Matrix_MakeRotationZ(fAngleRad)
  {
    var matrix=new mat4x4();

    matrix.set(0, 0, Math.cos(fAngleRad));
    matrix.set(0, 1, Math.sin(fAngleRad));
    matrix.set(1, 0, -Math.sin(fAngleRad));
    matrix.set(1, 1, Math.cos(fAngleRad));
    matrix.set(2, 2, 1);
    matrix.set(3, 3, 1);

    return matrix;
  }

  Matrix_MakeTranslation(x, y, z)
  {
    var matrix=new mat4x4();

    matrix.set(0, 0, 1);
    matrix.set(1, 1, 1);
    matrix.set(2, 2, 1);
    matrix.set(3, 3, 1);
    matrix.set(3, 0, x);
    matrix.set(3, 1, y);
    matrix.set(3, 2, z);

    return matrix;
  }

  Matrix_MakeProjection(fFovDegrees, fAspectRatio, fNear, fFar)
  {
    var matrix=new mat4x4();
    var fFovRad=1/Math.tan(fFovDegrees*(0.5/180)*Math.PI);

    matrix.set(0, 0, fAspectRatio*fFovRad);
    matrix.set(1, 1, fFovRad);
    matrix.set(2, 2, fFar/(fFar-fNear));
    matrix.set(3, 2, (-fFar * fNear) / (fFar - fNear));
    matrix.set(2, 3, 1);
    matrix.set(3, 3, 0);

    return matrix;
  }

  Matrix_MultiplyMatrix(m1, m2)
  {
    var matrix=new mat4x4();

    for (var c=0; c<4; c++)
      for (var r=0; r<4; r++)
        matrix.set(r, c, (m1.get(r, 0)*m2.get(0, c)) + (m1.get(r, 1)*m2.get(1, c)) + (m1.get(r, 2)*m2.get(2, c)) + (m1.get(r, 3)*m2.get(3, c)));

    return matrix;
  }

  Matrix_PointAt(pos, target, up)
  {
    // Calculate new forward direction
    var newForward=this.Vector_Sub(target, pos);
    newForward=this.Vector_Normalise(newForward);

    // Calculate new Up direction
    var a=this.Vector_Mul(newForward, this.Vector_DotProduct(up, newForward));
    var newUp=this.Vector_Sub(up, a);
    newUp=this.Vector_Normalise(newUp);

    // New Right direction is easy, its just cross product
    var newRight=this.Vector_CrossProduct(newUp, newForward);

    // Construct Dimensioning and Translation Matrix	
    var matrix=new mat4x4();

    matrix.set(0, 0, newRight.x);   matrix.set(0, 1, newRight.y);   matrix.set(0, 2, newRight.z);   matrix.set(0, 3, 0);
    matrix.set(1, 0, newUp.x);      matrix.set(1, 1, newUp.y);      matrix.set(1, 2, newUp.z);      matrix.set(1, 3, 0);
    matrix.set(2, 0, newForward.x); matrix.set(2, 1, newForward.y); matrix.set(2, 2, newForward.z); matrix.set(2, 3, 0);
    matrix.set(3, 0, pos.x);        matrix.set(3, 1, pos.y);        matrix.set(3, 2, pos.z);        matrix.set(3, 3, 1);

    return matrix;
  }

  Matrix_QuickInverse(m) // Only for Rotation/Translation Matrices, to convert PointAt to LookAt matrix
  {
    var matrix=new mat4x4();

    matrix.set(0, 0, m.get(0, 0)); matrix.set(0, 1, m.get(1, 0)); matrix.set(0, 2, m.get(2, 0)); matrix.set(0, 3, 0);
    matrix.set(1, 0, m.get(0, 1)); matrix.set(1, 1, m.get(1, 1)); matrix.set(1, 2, m.get(2, 1)); matrix.set(1, 3, 0);
    matrix.set(2, 0, m.get(0, 2)); matrix.set(2, 1, m.get(1, 2)); matrix.set(2, 2, m.get(2, 2)); matrix.set(2, 3, 0);

    matrix.set(3, 0, -((m.get(3, 0) * matrix.get(0, 0)) + (m.get(3, 1) * matrix.get(1, 0)) + (m.get(3, 2) * matrix.get(2, 0))));
    matrix.set(3, 1, -((m.get(3, 0) * matrix.get(0, 1)) + (m.get(3, 1) * matrix.get(1, 1)) + (m.get(3, 2) * matrix.get(2, 1))));
    matrix.set(3, 2, -((m.get(3, 0) * matrix.get(0, 2)) + (m.get(3, 1) * matrix.get(1, 2)) + (m.get(3, 2) * matrix.get(2, 2))));
    matrix.set(3, 3, 1);

    return matrix;
  }

  Vector_Add(v1, v2)
  {
    return new vec3d(v1.x+v2.x, v1.y+v2.y, v1.z+v2.z);
  }


  Vector_Sub(v1, v2)
  {
    return new vec3d(v1.x-v2.x, v1.y-v2.y, v1.z-v2.z);
  }

  Vector_Mul(v1, k)
  {
    return new vec3d(v1.x*k, v1.y*k, v1.z*k);
  }

  Vector_Div(v1, k)
  {
    return new vec3d(v1.x/k, v1.y/k, v1.z/k);
  }

  Vector_DotProduct(v1, v2)
  {
    return (v1.x*v2.x) + (v1.y*v2.y) + (v1.z*v2.z);
  }

  Vector_Length(v)
  {
    return Math.sqrt(this.Vector_DotProduct(v, v));
  }

  Vector_Normalise(v)
  {
    var l=this.Vector_Length(v);

    return new vec3d(v.x/l, v.y/l, v.z/l);
  }

  Vector_CrossProduct(v1, v2)
  {
    var v=new vec3d();

    v.x=(v1.y*v2.z) - (v1.z*v2.y);
    v.y=(v1.z*v2.x) - (v1.x*v2.z);
    v.z=(v1.x*v2.y) - (v1.y*v2.x);

    return v;
  }

  Vector_IntersectPlane(plane_p, plane_n, lineStart, lineEnd)
  {
    plane_n=this.Vector_Normalise(plane_n);
    var plane_d=-this.Vector_DotProduct(plane_n, plane_p);
    var ad=this.Vector_DotProduct(lineStart, plane_n);
    var bd=this.Vector_DotProduct(lineEnd, plane_n);
    var t=((-plane_d)-ad) / (bd-ad);
    var lineStartToEnd=this.Vector_Sub(lineEnd, lineStart);
    var lineToIntersect=this.Vector_Mul(lineStartToEnd, t);

    return this.Vector_Add(lineStart, lineToIntersect);
  }

  Triangle_ClipAgainstPlane(plane_p, plane_n, in_tri, out_tri)
  {
    var that=this;

    // Make sure plane normal is indeed normal
    plane_n=this.Vector_Normalise(plane_n);

    // Return signed shortest distance from point to plane, plane normal must be normalised
    var dist=function(p)
    {
      var n=that.Vector_Normalise(p);

      return ((plane_n.x*p.x) + (plane_n.y*p.y) + (plane_n.z*p.z) - that.Vector_DotProduct(plane_n, plane_p));
    };

    // Create two temporary storage arrays to classify points either side of plane
    // If distance sign is positive, point lies on "inside" of plane
    var inside_points=new Array(3);  var nInsidePointCount=0;
    var outside_points=new Array(3); var nOutsidePointCount=0;

    // Get signed distance of each point in triangle to plane
    var d0=dist(in_tri.p[0]);
    var d1=dist(in_tri.p[1]);
    var d2=dist(in_tri.p[2]);

    if (d0>=0)
      inside_points[nInsidePointCount++]=in_tri.p[0];
    else
      outside_points[nOutsidePointCount++]=in_tri.p[0];

    if (d1>=0)
      inside_points[nInsidePointCount++]=in_tri.p[1];
    else
      outside_points[nOutsidePointCount++]=in_tri.p[1];

    if (d2>=0)
      inside_points[nInsidePointCount++]=in_tri.p[2];
    else
      outside_points[nOutsidePointCount++]=in_tri.p[2];

    // Now classify triangle points, and break the input triangle into smaller output triangles if required

    if (nInsidePointCount==0)
    {
      // All points lie on the outside of plane, so clip whole triangle
      // It ceases to exist

      return 0; // No returned triangles are valid
    }

    if (nInsidePointCount==3)
    {
      // All points lie on the inside of plane, so do nothing
      // and allow the triangle to simply pass through
      out_tri[0]=in_tri.clone();

      return 1; // Just the one returned original triangle is valid
    }

    if ((nInsidePointCount==1) && (nOutsidePointCount==2))
    {
      // Triangle should be clipped. As two points lie outside
      // the plane, the triangle simply becomes a smaller triangle
      out_tri[0]=in_tri.clone();

      // The inside point is valid, so keep that...
      out_tri[0].p[0]=inside_points[0];

      // but the two new points are at the locations where the
      // original sides of the triangle (lines) intersect with the plane
      out_tri[0].p[1]=this.Vector_IntersectPlane(plane_p, plane_n, inside_points[0], outside_points[0]);
      out_tri[0].p[2]=this.Vector_IntersectPlane(plane_p, plane_n, inside_points[0], outside_points[1]);

      return 1; // Return the newly formed single triangle
    }

    if ((nInsidePointCount==2) && (nOutsidePointCount==1))
    {
      // Triangle should be clipped. As two points lie inside the plane,
      // the clipped triangle becomes a "quad". Fortunately, we can
      // represent a quad with two new triangles
      out_tri[0]=in_tri.clone();
      out_tri[1]=in_tri.clone();

      // The first triangle consists of the two inside points and a new
      // point determined by the location where one side of the triangle
      // intersects with the plane
      out_tri[0].p[0]=inside_points[0];
      out_tri[0].p[1]=inside_points[1];
      out_tri[0].p[2]=this.Vector_IntersectPlane(plane_p, plane_n, inside_points[0], outside_points[0]);

      // The second triangle is composed of one of the inside points, a
      // new point determined by the intersection of the other side of the 
      // triangle and the plane, and the newly created point above
      out_tri[1].p[0]=inside_points[1];
      out_tri[1].p[1]=out_tri[0].p[2];
      out_tri[1].p[2]=this.Vector_IntersectPlane(plane_p, plane_n, inside_points[1], outside_points[0]);

      return 2; // Return two newly formed triangles which form a quad
    }

    return 0;
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

  gs.canvas.style.top=top+"px";
  gs.canvas.style.left=left+"px";

  gs.canvas.style.width=width+"px";
  gs.canvas.style.height=height+"px";
}

// Called as initial entry point once page is loaded
function startup()
{
  gs=new engine3D;

  resize();
  window.addEventListener("resize", resize);

  document.onkeydown=function(e)
  {
    e = e || window.event;
    updatekeystate(e, 1);
  };

  document.onkeyup=function(e)
  {
    e = e || window.event;
    updatekeystate(e, 0);
  };

  // Stop things from being dragged around
  window.ondragstart=function(e)
  { 
    e = e || window.event;
    e.preventDefault();
  };

  gs.start();

  //document.addEventListener("contextmenu", function(e){e.preventDefault();}, false);
}

// Run the init() once page has loaded
window.onload=function() { startup(); };
