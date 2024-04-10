
package uta.cse3310;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.UnknownHostException;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Map;

import org.java_websocket.WebSocket;
import org.java_websocket.drafts.Draft;
import org.java_websocket.drafts.Draft_6455;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
import java.util.Timer;
import java.util.TimerTask;
import java.util.Vector;
import java.util.concurrent.ConcurrentHashMap;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonElement;
import com.google.gson.JsonParser;

import java.util.UUID;

public class App extends WebSocketServer {

  // public ArrayList<Player> players = new ArrayList<Player>();
  private ArrayList<Player> activeSessions = new ArrayList<Player>();

  public ArrayList<String> words = new ArrayList<String>();

  public ArrayList<String> getWords() {
    String str;
    try {
      BufferedReader reader = new BufferedReader(new FileReader("filtered_words.txt"));
      while ((str = reader.readLine()) != null)
        this.words.add(str);
      reader.close();
    } catch (IOException e) {
      e.printStackTrace();
    }
    return this.words;
  }

  public App(int port) {
    super(new InetSocketAddress(port));
  }

  public App(InetSocketAddress address) {
    super(address);
  }

  public App(int port, Draft_6455 draft) {
    super(new InetSocketAddress(port), Collections.<Draft>singletonList(draft));
  }

  @Override
  public void onOpen(WebSocket conn, ClientHandshake handshake) {

    System.out.println(conn.getRemoteSocketAddress().getAddress().getHostAddress() + " connected");

    // ServerEvent E = new ServerEvent();

    // allows the websocket to give us the Game when a message arrives
    // conn.setAttachment(G);

    Gson gson = new Gson();
    // Note only send to the single connection
    // conn.send(gson.toJson(E));
    // System.out.println(gson.toJson(E));

    // The state of the game has changed, so lets send it to everyone
    String jsonString;
    jsonString = gson.toJson("test Onopen");
    handleNewConnection(conn);

    System.out.println(jsonString);
    broadcast(jsonString);

  }

  @Override
  public void onClose(WebSocket conn, int code, String reason, boolean remote) {
    System.out.println(conn + " has closed");
    // Retrieve the game tied to the websocket connection
    Game G = conn.getAttachment();
    G = null;
    GsonBuilder builder = new GsonBuilder();
    Gson gson = builder.create();
    // send out the game state every time
    // to everyone
    String jsonString;
    jsonString = gson.toJson(G);
    broadcast(jsonString);
  }

  @Override
  public void onMessage(WebSocket conn, String message) {
    System.out.println(conn + ": " + message);

    // Bring in the data from the webpage
    // A UserEvent is all that is allowed at this point
    GsonBuilder builder = new GsonBuilder();
    Gson gson = builder.create();
    handleMessage(gson, message);
    // UserEvent U = gson.fromJson(message, UserEvent.class);
    // System.out.println(U.Button);

    // Get our Game Object
    // Game G = conn.getAttachment();
    // G.Update(U);

    // send out the game state every time
    // to everyone
    String jsonString;
    jsonString = gson.toJson("Server recieved message");

    System.out.println(jsonString);
    broadcast(jsonString);
  }

  @Override
  public void onMessage(WebSocket conn, ByteBuffer message) {
    System.out.println(conn + ": " + message);
  }

  @Override
  public void onError(WebSocket conn, Exception ex) {
    ex.printStackTrace();
    if (conn != null) {
      // some errors like port binding failed may not be assignable to a specific
      // websocket
    }
  }

  @Override
  public void onStart() {
    System.out.println("Server started!");
    setConnectionLostTimeout(0);
  }

  public static String generateUniqueID() {
    return UUID.randomUUID().toString();
  }

  public void handleNewConnection(WebSocket socket) {
    String uid = generateUniqueID();
    Player newPlayer = new Player(uid);
    activeSessions.add(newPlayer);
    JsonObject jsonObject = new JsonObject();
    jsonObject.addProperty("screen", "landing");
    jsonObject.addProperty("type", "newSession");
    jsonObject.addProperty("uid", uid);
    // Send UID to the client
    broadcast(jsonObject.toString());
  }

  public void handleMessage(Gson gson, String jsonMessage) {
    // Parse the JSON string into a JsonElement
    JsonElement element = JsonParser.parseString(jsonMessage);
    // Convert the JsonElement to a JsonObject
    JsonObject message = element.getAsJsonObject();
    String screen = message.get("screen").getAsString();
    String type = message.get("type").getAsString();
    switch (screen) {
      case "landing":
        // validate username
        String username = message.get("username").getAsString();
        if (type.equals("validateUsername")) {
          System.out.println("test validate");
          validateUsername(username);
        }
        break;
      case "lobby":

        break;
      case "game":

        break;
    }
  }

  public boolean validateUsername(String username) {
    System.out.println("Username: " + username);
    return false;
  }

  public static void main(String[] args) {
    // Set up the http server
    int port = 9080;
    HttpServer H = new HttpServer(port, "./html");
    H.start();
    System.out.println("http Server started on port:" + port);

    // create and start the websocket server

    port = 9880;
    App A = new App(port);
    A.start();
    System.out.println("websocket Server started on port: " + port);

  }
}
